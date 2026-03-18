"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useTags } from "@/hooks/use-tags";
import { TAG_QUERY_LIMITS } from "@/lib/constants";
import { containsBannedWord } from "@/lib/tag-validation";
import { normalizeTagName } from "@/lib/tag-utils";
import type { TagItem } from "@/lib/types";

interface TagComboboxProps {
  /** Currently selected tag ID (empty string if new tag selected) */
  value: string;
  /** Currently selected tag name (for display) */
  displayName: string;
  /** New tag name (when user creates a new tag, not yet in DB) */
  newTagName?: string;
  /** Called when user selects an existing tag */
  onSelect: (tagId: string, tagName: string) => void;
  /** Called when user wants to create a new tag */
  onCreate: (newTagName: string) => void;
}

export function TagCombobox({
  value,
  displayName,
  newTagName,
  onSelect,
  onCreate,
}: TagComboboxProps) {
  const { tags, searchResults, isLoading, fetchTags, search, clearSearch } = useTags();
  const [inputValue, setInputValue] = useState(displayName || newTagName || "");
  const [isOpen, setIsOpen] = useState(false);
  const [isUserSearching, setIsUserSearching] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch tags eagerly when a value (tagId) is already set (edit mode)
  useEffect(() => {
    if (value && tags.length === 0) {
      fetchTags();
    }
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setIsUserSearching(false);
        clearSearch();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [clearSearch]);

  // Update input when external value changes
  useEffect(() => {
    setInputValue(displayName || newTagName || "");
    setIsUserSearching(false);
  }, [displayName, newTagName]);

  // Resolve tag name from tagId when tags are loaded
  useEffect(() => {
    if (value && !inputValue && tags.length > 0) {
      const matchedTag = tags.find((t) => t.id === value);
      if (matchedTag) {
        setInputValue(matchedTag.name);
      }
    }
  }, [value, tags]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setInputValue(val);
      setIsUserSearching(true);
      setValidationError(null);

      const normalized = normalizeTagName(val);

      // Validation checks
      if (normalized.length > 20) {
        setValidationError("タグ名は20文字以内です");
        return;
      }
      if (containsBannedWord(normalized)) {
        setValidationError("使用できないタグ名です");
        return;
      }

      // Trigger search directly on user input (not via useEffect)
      if (val.trim()) {
        search(val.trim());
      } else {
        setIsUserSearching(false);
        clearSearch();
      }
    },
    [search, clearSearch],
  );

  const handleFocus = useCallback(() => {
    setIsOpen(true);
    // Fetch tags when user focuses the input
    if (tags.length === 0) {
      fetchTags();
    }
  }, [tags.length, fetchTags]);

  const handleSelectTag = useCallback(
    (tag: TagItem) => {
      setInputValue(tag.name);
      setIsOpen(false);
      setIsUserSearching(false);
      clearSearch();
      onSelect(tag.id, tag.name);
    },
    [onSelect, clearSearch],
  );

  const handleCreateTag = useCallback(() => {
    const normalized = normalizeTagName(inputValue);
    if (!normalized || normalized.length > 20 || containsBannedWord(normalized)) {
      return;
    }
    setInputValue(normalized);
    setIsOpen(false);
    setIsUserSearching(false);
    clearSearch();
    onCreate(normalized);
  }, [inputValue, onCreate, clearSearch]);

  // Determine which tags to show
  const displayTags = isUserSearching && inputValue.trim() ? searchResults : tags;
  const isSearching = isUserSearching && inputValue.trim().length > 0;
  const recentTags = displayTags.filter((t) => t.myUsageCount > 0).slice(0, TAG_QUERY_LIMITS.MINE);
  const popularTags = displayTags.filter((t) => t.myUsageCount === 0).slice(0, TAG_QUERY_LIMITS.POPULAR);
  const normalizedInput = normalizeTagName(inputValue);
  const exactMatch = displayTags.some(
    (t) => t.name === normalizedInput,
  ) || tags.some((t) => t.name === normalizedInput);
  const showCreateOption =
    normalizedInput.length > 0 &&
    normalizedInput.length <= 20 &&
    !exactMatch &&
    !containsBannedWord(normalizedInput) &&
    !validationError;

  const renderTagButton = (tag: TagItem) => (
    <button
      key={tag.id}
      type="button"
      onClick={() => handleSelectTag(tag)}
      className={`rounded-full border px-3 py-1 text-sm transition-colors ${
        tag.id === value
          ? "border-primary bg-primary/10 text-primary"
          : "border-border bg-secondary text-secondary-foreground hover:bg-muted"
      }`}
    >
      {tag.name}
    </button>
  );

  return (
    <div ref={containerRef} className="relative">
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onFocus={handleFocus}
        placeholder="タグを検索..."
        className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-ring"
        autoComplete="off"
      />

      {validationError && (
        <p className="mt-1 text-xs text-destructive">{validationError}</p>
      )}

      {isOpen && (
        <div className="absolute left-0 right-0 top-full z-10 mt-1 max-h-48 overflow-y-auto rounded-lg border border-border bg-card shadow-lg">
          {isLoading ? (
            <div className="p-3 text-center text-sm text-muted-foreground">
              読み込み中...
            </div>
          ) : (
            <>
              {isSearching ? (
                <div className="flex flex-wrap gap-2 p-3">
                  {displayTags.map(renderTagButton)}
                </div>
              ) : (
                <div className="p-3">
                  {recentTags.length > 0 && (
                    <>
                      <p className="mb-2 text-xs font-medium text-muted-foreground">最近</p>
                      <div className={`flex flex-wrap gap-2${popularTags.length > 0 ? " mb-3" : ""}`}>
                        {recentTags.map(renderTagButton)}
                      </div>
                    </>
                  )}
                  {popularTags.length > 0 && (
                    <>
                      <p className="mb-2 text-xs font-medium text-muted-foreground">人気</p>
                      <div className="flex flex-wrap gap-2">
                        {popularTags.map(renderTagButton)}
                      </div>
                    </>
                  )}
                </div>
              )}

              {showCreateOption && (
                <button
                  type="button"
                  onClick={handleCreateTag}
                  className="w-full border-t border-border px-3 py-2 text-left text-sm text-primary hover:bg-muted"
                >
                  + 「{normalizedInput}」を作成
                </button>
              )}

              {isUserSearching && displayTags.length === 0 && !showCreateOption && !isLoading && (
                <div className="p-3 text-center text-sm text-muted-foreground">
                  タグが見つかりません
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
