import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ProfileMediaEditor } from './profile-media-editor.js';

const createObjectURL = vi.fn(() => 'blob:preview');
const revokeObjectURL = vi.fn();

beforeEach(() => {
  vi.stubGlobal('URL', { ...URL, createObjectURL, revokeObjectURL });
  createObjectURL.mockClear();
  revokeObjectURL.mockClear();
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
    drawImage: vi.fn(),
    rotate: vi.fn(),
    scale: vi.fn(),
    translate: vi.fn()
  } as unknown as CanvasRenderingContext2D);
  vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation((callback, type) =>
    callback(new Blob(['crop'], { type: String(type) }))
  );
  vi.stubGlobal(
    'createImageBitmap',
    vi.fn(async () => ({ close: vi.fn() }))
  );
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({ blob: async () => new Blob(['image']) }))
  );
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function loadPreview() {
  const viewport = screen.getByRole('group', { name: /Área de recorte/ });
  vi.spyOn(viewport, 'getBoundingClientRect').mockReturnValue({
    width: 400,
    height: 400,
    top: 0,
    right: 400,
    bottom: 400,
    left: 0,
    x: 0,
    y: 0,
    toJSON: () => ({})
  });
  const image = screen.getByAltText('Prévia da imagem selecionada');
  Object.defineProperties(image, { naturalWidth: { value: 1200 }, naturalHeight: { value: 800 } });
  fireEvent.load(image);
  return image;
}

describe('ProfileMediaEditor', () => {
  it('oferece uma seleção estática simples sem apresentar GIF não suportado', () => {
    render(<ProfileMediaEditor aspectRatio={1} onCancel={vi.fn()} onConfirm={vi.fn()} />);
    expect(document.querySelector<HTMLInputElement>('.profile-media-editor__media-option input')).not.toBeNull();
    expect(document.querySelector<HTMLInputElement>('.profile-media-editor__media-option input')?.accept).toBe(
      'image/png,image/jpeg,image/webp'
    );
    expect(screen.getByText('Enviar imagem')).toBeDefined();
    expect(screen.queryByText('Enviar GIF')).toBeNull();
  });

  it('cria preview, permite substituir e revoga cada Object URL', () => {
    const { unmount } = render(
      <ProfileMediaEditor aspectRatio={1} onCancel={vi.fn()} onConfirm={vi.fn()} />
    );
    const input = document.querySelector<HTMLInputElement>('.profile-media-editor__media-option input')!;
    fireEvent.change(input, {
      target: { files: [new File(['a'], 'a.png', { type: 'image/png' })] }
    });
    expect(createObjectURL).toHaveBeenCalledOnce();

    fireEvent.change(screen.getByLabelText('Substituir imagem'), {
      target: { files: [new File(['b'], 'b.webp', { type: 'image/webp' })] }
    });
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:preview');
    unmount();
    expect(revokeObjectURL).toHaveBeenCalledTimes(2);
  });

  it('mostra erros locais de tipo e tamanho', () => {
    render(<ProfileMediaEditor aspectRatio={1} onCancel={vi.fn()} onConfirm={vi.fn()} />);
    const input = document.querySelector<HTMLInputElement>('.profile-media-editor__media-option input')!;
    fireEvent.change(input, {
      target: { files: [new File(['x'], 'x.gif', { type: 'image/gif' })] }
    });
    expect(screen.getByRole('alert').textContent).toMatch('Formato');
  });

  it('cancela por botão e Escape', () => {
    const onCancel = vi.fn();
    render(<ProfileMediaEditor aspectRatio={1} onCancel={onCancel} onConfirm={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    expect(onCancel).toHaveBeenCalledTimes(2);
  });

  it('descarta e revoga o preview ao cancelar', () => {
    render(
      <ProfileMediaEditor
        file={new File(['a'], 'a.png', { type: 'image/png' })}
        aspectRatio={1}
        onCancel={vi.fn()}
        onConfirm={vi.fn()}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:preview');
    expect(screen.queryByAltText('Prévia da imagem selecionada')).toBeNull();
  });

  it('suporta zoom e reposicionamento por teclado', () => {
    render(
      <ProfileMediaEditor
        file={new File(['a'], 'a.png', { type: 'image/png' })}
        aspectRatio={1}
        onCancel={vi.fn()}
        onConfirm={vi.fn()}
      />
    );
    loadPreview();
    const zoom = screen.getByRole('slider', { name: /Zoom/ });
    fireEvent.change(zoom, { target: { value: '2' } });
    expect((zoom as HTMLInputElement).value).toBe('2');
    const viewport = screen.getByRole('group', { name: /Área de recorte/ });
    fireEvent.keyDown(viewport, { key: 'ArrowRight' });
    expect(viewport).toBeTruthy();
  });

  it('mostra a imagem completa com máscara e alterna para a prévia final', async () => {
    render(
      <ProfileMediaEditor
        file={new File(['a'], 'a.png', { type: 'image/png' })}
        aspectRatio={1}
        viewportShape="circle"
        onCancel={vi.fn()}
        onConfirm={vi.fn()}
      />
    );
    loadPreview();
    expect(document.querySelector('.profile-media-editor__canvas')).not.toBeNull();
    expect(document.querySelector('.profile-media-editor__crop-window--circle')).not.toBeNull();
    fireEvent.click(screen.getByRole('tab', { name: 'Pré-visualizar' }));
    await waitFor(() => expect(screen.getByAltText('Prévia final do avatar')).toBeDefined());
    expect(screen.queryByAltText('Prévia da imagem selecionada')).toBeNull();
    fireEvent.click(screen.getByRole('tab', { name: 'Ajustar' }));
    expect(screen.getByAltText('Prévia da imagem selecionada')).toBeDefined();
  });

  it('usa máscara proporcional para banner e permite tentar novamente após falha da prévia', async () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementationOnce((callback) => callback(null));
    render(
      <ProfileMediaEditor
        file={new File(['a'], 'a.png', { type: 'image/png' })}
        aspectRatio={4}
        viewportShape="rectangle"
        onCancel={vi.fn()}
        onConfirm={vi.fn()}
      />
    );
    loadPreview();
    expect(document.querySelector('.profile-media-editor__crop-window--rectangle')).not.toBeNull();
    fireEvent.click(screen.getByRole('tab', { name: 'Pré-visualizar' }));
    expect((await screen.findByRole('alert')).textContent).toContain('Não foi possível gerar a prévia');
    vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation((callback, type) =>
      callback(new Blob(['crop'], { type: String(type) }))
    );
    fireEvent.click(screen.getByRole('tab', { name: 'Pré-visualizar' }));
    await waitFor(() => expect(screen.getByAltText('Prévia final do banner')).toBeDefined());
  });

  it('aplica 90/180/270, flip e redefine todos os ajustes', () => {
    render(
      <ProfileMediaEditor
        file={new File(['a'], 'a.png', { type: 'image/png' })}
        aspectRatio={1}
        onCancel={vi.fn()}
        onConfirm={vi.fn()}
      />
    );
    loadPreview();
    const image = screen.getByAltText('Prévia da imagem selecionada');
    const rotate = screen.getByRole('button', { name: 'Girar imagem 90 graus' });
    const flip = screen.getByRole('button', { name: 'Espelhar imagem horizontalmente' });
    const reset = screen.getByRole('button', { name: 'Redefinir ajustes' });

    fireEvent.click(rotate);
    expect(image.style.transform).toContain('rotate(90deg)');
    fireEvent.click(rotate);
    expect(image.style.transform).toContain('rotate(180deg)');
    fireEvent.click(rotate);
    expect(image.style.transform).toContain('rotate(270deg)');
    fireEvent.click(flip);
    expect(flip.getAttribute('aria-pressed')).toBe('true');
    expect(
      document.querySelector<HTMLElement>('.profile-media-editor__stage')?.style.transform
    ).toContain('scaleX(-1)');
    fireEvent.change(screen.getByRole('slider', { name: /Zoom/ }), { target: { value: '2' } });

    fireEvent.click(reset);
    expect(image.style.transform).toBe('');
    expect(flip.getAttribute('aria-pressed')).toBe('false');
    expect((screen.getByRole('slider', { name: /Zoom/ }) as HTMLInputElement).value).toBe('1');
    expect((reset as HTMLButtonElement).disabled).toBe(true);
  });

  it('redefine transformações ao substituir o arquivo', () => {
    render(
      <ProfileMediaEditor
        file={new File(['a'], 'a.png', { type: 'image/png' })}
        aspectRatio={1}
        onCancel={vi.fn()}
        onConfirm={vi.fn()}
      />
    );
    loadPreview();
    fireEvent.click(screen.getByRole('button', { name: 'Girar imagem 90 graus' }));
    fireEvent.click(screen.getByRole('button', { name: 'Espelhar imagem horizontalmente' }));
    fireEvent.change(screen.getByRole('slider', { name: /Zoom/ }), { target: { value: '2' } });

    fireEvent.change(screen.getByLabelText('Substituir imagem'), {
      target: { files: [new File(['b'], 'b.jpeg', { type: 'image/jpeg' })] }
    });
    loadPreview();

    expect(screen.getByAltText('Prévia da imagem selecionada').style.transform).toBe('');
    expect(
      screen
        .getByRole('button', { name: 'Espelhar imagem horizontalmente' })
        .getAttribute('aria-pressed')
    ).toBe('false');
    expect((screen.getByRole('slider', { name: /Zoom/ }) as HTMLInputElement).value).toBe('1');
    expect(
      (screen.getByRole('button', { name: 'Redefinir ajustes' }) as HTMLButtonElement).disabled
    ).toBe(true);
  });

  it('confirma Blob processado e bloqueia clique duplo durante processamento', async () => {
    let release: ((value: Blob) => void) | undefined;
    vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation((callback) => {
      release = (blob) => callback(blob);
    });
    const onConfirm = vi.fn();
    render(
      <ProfileMediaEditor
        file={new File(['a'], 'a.png', { type: 'image/png' })}
        aspectRatio={1}
        outputWidth={256}
        outputHeight={256}
        onCancel={vi.fn()}
        onConfirm={onConfirm}
      />
    );
    loadPreview();
    const confirm = screen.getByRole('button', { name: 'Confirmar recorte' });
    fireEvent.click(confirm);
    expect(
      (screen.getByRole('button', { name: 'Processando…' }) as HTMLButtonElement).disabled
    ).toBe(true);
    await waitFor(() => expect(release).toBeTypeOf('function'));
    release?.(new Blob(['crop'], { type: 'image/png' }));
    await waitFor(() =>
      expect(onConfirm).toHaveBeenCalledWith(
        expect.objectContaining({ width: 256, height: 256, mimeType: 'image/png' })
      )
    );
  });

  it('exibe erro quando o processamento falha', async () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation((callback) =>
      callback(null)
    );
    render(
      <ProfileMediaEditor
        file={new File(['a'], 'a.png', { type: 'image/png' })}
        aspectRatio={1}
        onCancel={vi.fn()}
        onConfirm={vi.fn()}
      />
    );
    loadPreview();
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar recorte' }));
    expect((await screen.findByRole('alert')).textContent).toMatch('Não foi possível processar');
  });
});
