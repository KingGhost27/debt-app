/**
 * Category Manager Component: ranch edition.
 *
 * Manages custom categories and color overrides for built-in categories.
 * Supports add, edit, delete for custom categories. Rows, fields and buttons
 * use the shared ranch classes (pages/settings.css section 6).
 */

import { useState } from 'react';
import { Plus, Pencil, Trash2, X, Check, Lock } from 'lucide-react';
import { ConfirmDialog } from './ConfirmDialog';
import { useConfirmDialog } from '../../hooks/useConfirmDialog';
import { useApp } from '../../context/AppContext';
import { useToast } from './Toast';
import { UpgradeModal } from './UpgradeModal';
import { useFeatureGate } from '../../hooks/useFeatureGate';
import { FREE_LIMITS } from '../../lib/tierLimits';
import { CATEGORY_INFO } from '../../types';
import type { DebtCategory, CustomCategory } from '../../types';
import '../../pages/settings.css';

export function CategoryManager() {
  const {
    customCategories,
    settings,
    debts,
    addCustomCategory,
    updateCustomCategory,
    deleteCustomCategory,
    updateCategoryColor,
  } = useApp();
  const { showToast } = useToast();

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('#8b5cf6');
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');
  const [showUpgrade, setShowUpgrade] = useState(false);
  const { confirm, dialogProps } = useConfirmDialog();
  const { canAddCustomCategory, isPro } = useFeatureGate();

  const handleAddClick = () => {
    if (!canAddCustomCategory) {
      setShowUpgrade(true);
      return;
    }
    setIsAdding(true);
  };

  const builtInCategories = Object.entries(CATEGORY_INFO) as [DebtCategory, { label: string; color: string }][];

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) return;

    addCustomCategory({
      name: newCategoryName.trim(),
      color: newCategoryColor,
    });

    setNewCategoryName('');
    setNewCategoryColor('#8b5cf6');
    setIsAdding(false);
  };

  const handleStartEdit = (category: CustomCategory) => {
    setEditingId(category.id);
    setEditName(category.name);
    setEditColor(category.color);
  };

  const handleSaveEdit = () => {
    if (!editingId || !editName.trim()) return;

    updateCustomCategory(editingId, {
      name: editName.trim(),
      color: editColor,
    });

    setEditingId(null);
  };

  const handleDelete = (id: string, name: string) => {
    // Check if any debts use this category
    const debtsUsingCategory = debts.filter((d) => d.category === id);
    if (debtsUsingCategory.length > 0) {
      showToast(`Cannot delete "${name}" - ${debtsUsingCategory.length} debt(s) are using this category.`, 'warning');
      return;
    }

    confirm({
      title: 'Delete Category',
      message: `Are you sure you want to delete "${name}"?`,
      confirmLabel: 'Delete',
      variant: 'danger',
      onConfirm: () => deleteCustomCategory(id),
    });
  };

  const handleBuiltInColorChange = (categoryId: DebtCategory, color: string) => {
    updateCategoryColor(categoryId, color);
  };

  const getEffectiveColor = (categoryId: DebtCategory, defaultColor: string) => {
    return settings.categoryColors[categoryId] || defaultColor;
  };

  return (
    <div className="cat">
      {/* Built-in categories with color override */}
      <div className="cat-group">
        <h3 className="cat-h">Built-in Categories</h3>
        <div className="cat-list">
          {builtInCategories.map(([id, info]) => (
            <div key={id} className="cat-row">
              <div className="cat-name">
                <span className="cat-dot" style={{ backgroundColor: getEffectiveColor(id, info.color) }} />
                <span>{info.label}</span>
              </div>
              <div className="cat-tools">
                {settings.categoryColors[id] && (
                  <button type="button" onClick={() => updateCategoryColor(id, '')} className="set-link" title="Reset to default">
                    Reset
                  </button>
                )}
                <input
                  type="color"
                  value={getEffectiveColor(id, info.color)}
                  onChange={(e) => handleBuiltInColorChange(id, e.target.value)}
                  className="cat-color"
                  title="Change color"
                  aria-label={`Color for ${info.label}`}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Custom categories */}
      <div className="cat-group">
        <div className="cat-gh">
          <h3 className="cat-h">Custom Categories</h3>
          {!isAdding && (
            <button
              type="button"
              onClick={handleAddClick}
              className="set-btn ghost sm"
              title={
                !canAddCustomCategory
                  ? `Free plan is limited to ${FREE_LIMITS.CUSTOM_CATEGORIES} custom categories`
                  : 'Add a custom category'
              }
            >
              {!isPro && !canAddCustomCategory ? <Lock size={16} /> : <Plus size={16} />}
              Add
            </button>
          )}
        </div>

        <div className="cat-list">
          {isAdding && (
            <div className="cat-add">
              <div className="cat-add-row">
                <input
                  type="color"
                  value={newCategoryColor}
                  onChange={(e) => setNewCategoryColor(e.target.value)}
                  className="th-color"
                  aria-label="Category color"
                />
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Category name"
                  aria-label="Category name"
                  className="set-input"
                  autoFocus
                />
              </div>
              <div className="cat-add-acts">
                <button
                  type="button"
                  onClick={() => {
                    setIsAdding(false);
                    setNewCategoryName('');
                  }}
                  className="set-btn ghost sm"
                >
                  Cancel
                </button>
                <button type="button" onClick={handleAddCategory} disabled={!newCategoryName.trim()} className="set-btn sm">
                  Add Category
                </button>
              </div>
            </div>
          )}

          {customCategories.map((category) => (
            <div key={category.id} className="cat-row">
              {editingId === category.id ? (
                <div className="cat-edit">
                  <input type="color" value={editColor} onChange={(e) => setEditColor(e.target.value)} className="cat-color" aria-label="Category color" />
                  <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="set-input" aria-label="Category name" autoFocus />
                  <button type="button" onClick={handleSaveEdit} className="cat-ib" aria-label="Save category" style={{ color: 'var(--ranch-ok-ink)' }}>
                    <Check size={18} />
                  </button>
                  <button type="button" onClick={() => setEditingId(null)} className="cat-ib" aria-label="Cancel editing">
                    <X size={18} />
                  </button>
                </div>
              ) : (
                <>
                  <div className="cat-name">
                    <span className="cat-dot" style={{ backgroundColor: category.color }} />
                    <span>{category.name}</span>
                  </div>
                  <div className="cat-tools">
                    <button type="button" onClick={() => handleStartEdit(category)} className="cat-ib" aria-label={`Edit ${category.name}`}>
                      <Pencil size={17} />
                    </button>
                    <button type="button" onClick={() => handleDelete(category.id, category.name)} className="cat-ib is-danger" aria-label={`Delete ${category.name}`}>
                      <Trash2 size={17} />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}

          {customCategories.length === 0 && !isAdding && (
            <p className="cat-empty">No custom categories yet. Add one above!</p>
          )}
        </div>
      </div>

      <ConfirmDialog {...dialogProps} />

      {showUpgrade && <UpgradeModal onDismiss={() => setShowUpgrade(false)} />}
    </div>
  );
}
