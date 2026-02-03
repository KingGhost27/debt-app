/**
 * Category Manager Component
 *
 * Manages custom categories and color overrides for built-in categories.
 * Supports add, edit, delete for custom categories.
 */

import { useState } from 'react';
import { Plus, Pencil, Trash2, X, Check, Tag } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useToast } from './Toast';
import { CATEGORY_INFO } from '../../types';
import type { DebtCategory, CustomCategory } from '../../types';

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

    if (window.confirm(`Delete category "${name}"?`)) {
      deleteCustomCategory(id);
    }
  };

  const handleBuiltInColorChange = (categoryId: DebtCategory, color: string) => {
    updateCategoryColor(categoryId, color);
  };

  const getEffectiveColor = (categoryId: DebtCategory, defaultColor: string) => {
    return settings.categoryColors[categoryId] || defaultColor;
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <Tag size={20} />
        Categories
      </h3>

      {/* Built-in categories with color override */}
      <div>
        <h4 className="text-sm font-medium text-gray-500 mb-3">Built-in Categories</h4>
        <div className="space-y-2">
          {builtInCategories.map(([id, info]) => (
            <div
              key={id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: getEffectiveColor(id, info.color) }}
                />
                <span className="font-medium">{info.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={getEffectiveColor(id, info.color)}
                  onChange={(e) => handleBuiltInColorChange(id, e.target.value)}
                  className="w-8 h-8 rounded cursor-pointer border border-gray-200"
                  title="Change color"
                />
                {settings.categoryColors[id] && (
                  <button
                    onClick={() => updateCategoryColor(id, '')}
                    className="text-xs text-gray-500 hover:text-gray-700"
                    title="Reset to default"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Custom categories */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-gray-500">Custom Categories</h4>
          {!isAdding && (
            <button
              onClick={() => setIsAdding(true)}
              className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700"
            >
              <Plus size={16} />
              Add
            </button>
          )}
        </div>

        <div className="space-y-2">
          {/* Add new category form */}
          {isAdding && (
            <div className="p-3 bg-primary-50 rounded-xl border-2 border-primary-200">
              <div className="flex items-center gap-3 mb-3">
                <input
                  type="color"
                  value={newCategoryColor}
                  onChange={(e) => setNewCategoryColor(e.target.value)}
                  className="w-8 h-8 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Category name"
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg"
                  autoFocus
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => {
                    setIsAdding(false);
                    setNewCategoryName('');
                  }}
                  className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddCategory}
                  disabled={!newCategoryName.trim()}
                  className="px-3 py-1.5 text-sm bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add Category
                </button>
              </div>
            </div>
          )}

          {/* List of custom categories */}
          {customCategories.map((category) => (
            <div
              key={category.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"
            >
              {editingId === category.id ? (
                // Edit mode
                <div className="flex-1 flex items-center gap-3">
                  <input
                    type="color"
                    value={editColor}
                    onChange={(e) => setEditColor(e.target.value)}
                    className="w-8 h-8 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="flex-1 px-3 py-1 border border-gray-200 rounded-lg"
                    autoFocus
                  />
                  <button
                    onClick={handleSaveEdit}
                    className="p-1 text-green-600 hover:text-green-700"
                  >
                    <Check size={18} />
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="p-1 text-gray-400 hover:text-gray-600"
                  >
                    <X size={18} />
                  </button>
                </div>
              ) : (
                // Display mode
                <>
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: category.color }}
                    />
                    <span className="font-medium">{category.name}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleStartEdit(category)}
                      className="p-2 text-gray-400 hover:text-gray-600"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(category.id, category.name)}
                      className="p-2 text-gray-400 hover:text-red-500"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}

          {customCategories.length === 0 && !isAdding && (
            <p className="text-sm text-gray-500 text-center py-4">
              No custom categories yet. Add one above!
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
