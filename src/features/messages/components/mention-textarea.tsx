import { useRef, useState } from 'react';
import type { ChangeEvent, KeyboardEvent } from 'react';
import { Textarea } from '../../../components/ui/textarea.js';
import { getMentionQuery, insertMention, type MentionableUser } from './mention-utils.js';

interface MentionTextareaProps {
  value: string;
  users?: MentionableUser[];
  onChange: (value: string) => void;
  onMentionSelect?: (user: MentionableUser) => void;
  placeholder?: string;
  ariaLabel?: string;
  disabled?: boolean;
  rows?: number;
  className?: string;
}

function getInitials(user: MentionableUser) {
  return user.displayName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export function MentionTextarea({
  value,
  users = [],
  onChange,
  onMentionSelect,
  placeholder = 'Escreva uma mensagem...',
  ariaLabel = 'Mensagem',
  disabled = false,
  rows = 3,
  className = ''
}: MentionTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [cursorPosition, setCursorPosition] = useState(value.length);
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const mentionQuery = getMentionQuery(value, cursorPosition);
  const suggestions = mentionQuery
    ? users
        .filter((user) => user.username.toLowerCase().startsWith(mentionQuery.query.toLowerCase()))
        .slice(0, 6)
    : [];
  const visibleSuggestions = isSuggestionsOpen ? suggestions : [];
  const activeIndex = Math.min(selectedIndex, Math.max(visibleSuggestions.length - 1, 0));

  function updateCursorPosition(element: HTMLTextAreaElement) {
    setCursorPosition(element.selectionStart);
  }

  function handleChange(event: ChangeEvent<HTMLTextAreaElement>) {
    const nextValue = event.target.value;
    onChange(nextValue);
    setCursorPosition(event.target.selectionStart);
    setSelectedIndex(0);
    setIsSuggestionsOpen(true);
  }

  function selectMention(user: MentionableUser) {
    const result = insertMention(value, cursorPosition, user);
    onChange(result.value);
    onMentionSelect?.(user);
    setCursorPosition(result.cursorPosition);
    setIsSuggestionsOpen(false);
    setSelectedIndex(0);

    requestAnimationFrame(() => {
      textareaRef.current?.focus();
      textareaRef.current?.setSelectionRange(result.cursorPosition, result.cursorPosition);
    });
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (!visibleSuggestions.length) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setSelectedIndex((index) => (index + 1) % visibleSuggestions.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setSelectedIndex(
        (index) => (index - 1 + visibleSuggestions.length) % visibleSuggestions.length
      );
    } else if (event.key === 'Enter' || event.key === 'Tab') {
      event.preventDefault();
      selectMention(visibleSuggestions[activeIndex]);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      setIsSuggestionsOpen(false);
    }
  }

  return (
    <div className="relative">
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onClick={(event) => updateCursorPosition(event.currentTarget)}
        onKeyUp={(event) => updateCursorPosition(event.currentTarget)}
        onFocus={(event) => {
          updateCursorPosition(event.currentTarget);
          setIsSuggestionsOpen(true);
        }}
        placeholder={placeholder}
        aria-label={ariaLabel}
        aria-autocomplete="list"
        aria-controls={visibleSuggestions.length ? 'mention-suggestions' : undefined}
        disabled={disabled}
        rows={rows}
        className={className}
      />
      {visibleSuggestions.length > 0 && (
        <ul
          id="mention-suggestions"
          role="listbox"
          aria-label="Pessoas para mencionar"
          className="absolute z-10 mt-2 max-h-60 w-full overflow-auto rounded-[var(--radius-md)] border border-[color:var(--color-border-default)] bg-[color:var(--color-surface-primary)] p-1 shadow-lg"
        >
          {visibleSuggestions.map((user, index) => (
            <li key={user.id} role="option" aria-selected={index === activeIndex}>
              <button
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => selectMention(user)}
                className="flex w-full items-center gap-3 rounded-[var(--radius-sm)] px-3 py-2 text-left hover:bg-[color:var(--color-action-secondary)] aria-selected:bg-[color:var(--color-action-secondary)]"
              >
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt="" className="h-8 w-8 rounded-full object-cover" />
                ) : (
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[color:var(--color-brand-primary)] text-xs font-bold text-white">
                    {getInitials(user)}
                  </span>
                )}
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-[color:var(--color-text-primary)]">
                    {user.displayName}
                  </span>
                  <span className="block truncate text-xs text-[color:var(--color-text-secondary)]">
                    @{user.username}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
