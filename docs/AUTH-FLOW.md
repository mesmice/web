# Fluxo de Autenticação do Mesmice

Este documento explica, de forma simples e organizada, como funcionam as telas de **login** e **cadastro** do Mesmice. Ele cobre o que já foi implementado no frontend, quais dados são coletados, por que certas decisões de interface foram tomadas, quais bibliotecas e assets estão em uso, e o que falta para conectar tudo ao backend.

---

## 1. Visão geral

A autenticação tem duas telas principais:

| Rota        | Função                               |
| ----------- | ------------------------------------ |
| `/login`    | Entrada de quem já tem conta         |
| `/register` | Criação de uma nova conta, em etapas |

Ambas foram construídas com **React + TypeScript**, usando **React Router** para navegação, **Tailwind CSS** para o visual e ícones do **lucide-react**.

Por enquanto, tudo funciona apenas no frontend: os formulários já validam os dados e montam os "pacotes" (payloads) que serão enviados ao servidor, mas **nenhuma chamada real à API foi feita ainda** — isso é o próximo passo.

---

## 2. Tela de Login

**Arquivo:** `src/features/auth/login-page.tsx`

### O que a tela faz

- **E-mail ou telefone**: o usuário pode entrar com qualquer um dos dois.
- **Senha**: tem um botão de olho para mostrar/ocultar o texto digitado.
- **Lembrar de mim**: opção já vem marcada por padrão.
- **Esqueceu a senha?**: botão presente na tela, mas ainda sem funcionalidade — está reservado para quando o fluxo de recuperação de senha for criado.
- **Botão Entrar**: valida o formulário e organiza os dados no formato abaixo, pronto para ser enviado à API:

```ts
type LoginPayload = {
  identifier: string; // e-mail ou telefone digitado
  password: string;
  rememberMe: boolean;
};
```

O texto digitado no campo de identificação já é "limpo" automaticamente (remove espaços extras nas pontas) antes de ser usado. Quando o backend estiver pronto, basta trocar esse trecho por uma chamada real usando o cliente HTTP em `src/lib/api/client.ts`.

### QR Code

A tela mostra um QR code que pode futuramente ser usado para login rápido (por exemplo, escaneando com o celular). Ele é gerado direto no navegador, sem depender de nenhum servidor, usando a biblioteca `qrcode`.

Detalhes técnicos:

- Aponta sempre para a URL de login do próprio ambiente (funciona tanto em produção quanto em testes locais).
- Gerado em alta resolução (340px) e exibido reduzido (256px), com cantos arredondados.
- Cores seguem a identidade visual do Mesmice: roxo escuro (`#2b1861`) sobre fundo branco, para garantir boa leitura pela câmera.
- A geração acontece em segundo plano e foi protegida contra um bug comum: se o usuário sair da tela antes do QR code terminar de ser criado, o app não tenta mais atualizar uma tela que já não existe.

### Mascote escondido (easter egg)

Há um pequeno detalhe divertido: o mascote do Mesmice fica discretamente escondido no canto do painel roxo. Se o usuário clicar nele três vezes, o mascote aparece animado por 10 segundos e depois volta a se esconder.

Esse elemento foi construído pensando em acessibilidade: o botão tem uma descrição para leitores de tela, mas a imagem em si é tratada como puramente decorativa.

---

## 3. Tela de Cadastro

**Arquivo:** `src/features/auth/register-page.tsx`

O cadastro foi dividido em **4 etapas**, para não sobrecarregar o usuário com um formulário gigante de uma vez só:

1. Conta
2. Personalizar a conta
3. Interesses
4. Revisão final

### Etapa 1 — Conta

Aqui o usuário cria as credenciais básicas:

- Nome de exibição
- Nome de usuário
- E-mail **ou** celular
- Se escolher celular, também seleciona o país (Brasil, Angola, Portugal, EUA, Itália ou Reino Unido)
- Senha (mínimo 8 caracteres) + confirmação de senha
- Aceite obrigatório dos termos de uso e da política de privacidade

Quando o método escolhido é telefone, o sistema remove automaticamente qualquer caractere que não seja número e, no caso do Brasil, aplica a máscara `(11) 99999-9999` automaticamente enquanto a pessoa digita.

O usuário só consegue avançar para a próxima etapa quando: todos os campos obrigatórios estiverem preenchidos, as duas senhas forem iguais, e os termos tiverem sido aceitos.

### Etapa 2 — Personalizar a conta

Esta etapa define a identidade visual inicial do perfil:

- Foto de perfil
- Data de nascimento
- Bio curta (opcional, até 190 caracteres)
- Cor de identidade do perfil

**Verificação de idade:** o sistema calcula a idade a partir da data de nascimento completa. Se a pessoa tiver menos de 14 anos, aparece um aviso visual e ela não consegue continuar o cadastro.

**Ajuste da foto:** depois de escolher uma imagem, o usuário pode arrastá-la dentro do círculo de perfil para escolher qual parte da foto quer destacar — como um "zoom e enquadramento" manual. Essa posição escolhida é lembrada e reaparece igual na prévia, na tela de revisão e nos dados finais enviados.

### Etapa 3 — Interesses

O usuário escolhe, entre catorze opções, quais assuntos mais combinam com ele:

Tecnologia, Programação, Games, Música, Filmes e séries, Design, Arte, Futebol, Negócios, Ciência, Anime, Memes, Fotografia e Educação.

Pode selecionar mais de um. Esses interesses aparecem depois como tags na tela de revisão e, no futuro, serão usados para personalizar a experiência do usuário na Home do app.

### Etapa 4 — Revisão

Antes de finalizar, o usuário vê um resumo com:

- Nome e nome de usuário
- Bio
- Cor de perfil escolhida
- Foto (com o mesmo enquadramento definido na Etapa 2)
- Interesses selecionados

Uma decisão de design importante: o **banner** dessa tela de revisão é sempre branco, independentemente da cor de perfil escolhida. Isso porque a cor selecionada representa a identidade do perfil do usuário — não o banner da tela em si. São dois elementos visuais separados, de propósito.

---

## 4. Como os dados do cadastro são organizados

Existe uma função (`buildRegistrationPayload`) que centraliza a montagem de todos os dados coletados nas quatro etapas, evitando repetir esse código em vários lugares. O formato final é:

```ts
type RegistrationPayload = {
  name: string;
  username: string;
  about: string;
  contact: string;
  phoneCountry: string;
  contactMethod: 'email' | 'phone';
  birthDay: string;
  birthMonth: string;
  birthYear: string;
  birthDate: string;
  password: string;
  profileColor: string;
  avatarFileName: string;
  avatarMimeType: string;
  interests: string[];
  termsAccepted: boolean;
  avatarPosition: { x: number; y: number };
  avatar: {
    fileName: string;
    mimeType: string;
    dataUrl: string;
  } | null;
};
```

Pontos importantes:

- A **confirmação de senha** existe só para conferência no próprio formulário — ela nunca é enviada ao backend, só a senha final.
- A **foto de perfil** hoje é guardada como uma "imagem em texto" (Data URL), o que permite mostrar a prévia instantaneamente na tela. Isso é uma solução temporária: em produção, o ideal é trocar por um upload de arquivo de verdade ou por armazenamento próprio no backend.

---

## 5. O que falta para conectar com a API

O projeto já tem a estrutura pronta para receber a integração: um cliente HTTP (`src/lib/api/client.ts`), tipos definidos (`src/lib/types/api.ts`) e simulações de API para testes (`src/mocks/handlers.ts`, usando MSW).

**Para o login funcionar de verdade, falta:**

1. Criar (ou localizar) o endpoint de autenticação no backend.
2. Definir o formato da resposta em `src/lib/types/api.ts`.
3. Criar uma função que envie o `LoginPayload` para esse endpoint.
4. Trocar o código provisório do botão "Entrar" por uma chamada real, usando TanStack Query.
5. Tratar os estados de carregamento, erro, sessão criada e redirecionamento após o login.

**Para o cadastro funcionar de verdade, falta:**

1. Fechar o contrato final do `RegistrationPayload` com o backend.
2. Decidir como a foto será enviada (upload direto, link, ou a Data URL temporária atual).
3. Criar o endpoint real e seu equivalente simulado (mock) para testes.
4. Trocar o código provisório de `buildRegistrationPayload` por uma chamada real.
5. Salvar a sessão do usuário e redirecioná-lo após o cadastro ser concluído com sucesso.

Uma regra importante de arquitetura: os componentes de tela **não devem fazer chamadas diretas** à internet (`fetch`). Eles só cuidam da parte visual e da validação. Quem cuida de enviar dados, tratar erros e falar com o servidor é sempre a camada `lib/api`.

---

## 6. Assets visuais usados

Todos ficam na pasta `public/images/auth/`:

| Arquivo                        | Onde é usado                                     |
| ------------------------------ | ------------------------------------------------ |
| `logo-v2-lightmode.png`        | Logo no login e no cadastro                      |
| `logo-v2-darkmode.png`         | Logo no cadastro, sobre a superfície clara atual |
| `mascote-neutro-lightmode.png` | Mascote escondido na tela de login               |

Por estarem dentro da pasta `public`, são chamados diretamente pela raiz do projeto:

```tsx
<img src="/images/auth/logo-v2-lightmode.png" alt="Mesmice" />
```

---

## 7. Bibliotecas utilizadas e para que servem

| Biblioteca                     | Função                                                                    |
| ------------------------------ | ------------------------------------------------------------------------- |
| **React + TypeScript**         | Componentes, estado local, formulários e tipagem dos dados                |
| **React Router**               | Navegação entre `/`, `/login` e `/register` sem recarregar a página       |
| **Tailwind CSS**               | Layout, espaçamento, cores, responsividade e estilo visual geral          |
| **lucide-react**               | Ícones (e-mail, celular, senha, upload de imagem, etc.)                   |
| **qrcode** (+ `@types/qrcode`) | Geração do QR code real, direto no navegador                              |
| **TanStack Query**             | Vai controlar as chamadas à API (mutations) quando a integração for feita |
| **Zustand**                    | Controle de estado global da interface                                    |
| **MSW**                        | Simula respostas da API para testes, antes do backend real estar pronto   |

---

## 8. Animações e acessibilidade

- A transição entre as etapas do cadastro tem direção: avançar entra pela direita, voltar entra pela esquerda.
- Essa animação é **desativada automaticamente** para usuários que ativaram a preferência de "reduzir movimento" (`prefers-reduced-motion`) no sistema operacional.
- Botões clicáveis mostram o cursor de "mãozinha" (pointer).
- Imagens puramente decorativas são ocultadas de leitores de tela; imagens com informação relevante têm texto alternativo.
- O indicador de progresso do cadastro informa a etapa atual para leitores de tela.
- Os campos usam atributos como `autocomplete`, `required`, `minLength` e `inputMode` para facilitar o preenchimento, inclusive no celular.

---

## 9. Antes de abrir um Pull Request

Rodar, na raiz do projeto, e garantir que os três comandos passam sem erro:

```bash
npm run typecheck
npm run lint
npm run build
```
