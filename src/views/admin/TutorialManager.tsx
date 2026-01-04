/**
 * TutorialManager Component
 * 
 * Admin view for managing tutorials. Refactored to use useTutorials hook
 * for separation of concerns - UI logic only, business logic in hook.
 */

import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useTutorials } from '../../features/tutorials';
import { Button, Input, Modal, LoadingSpinner } from '../../components/ui';
import { Video, Plus, Trash2, Settings, AlertCircle } from 'lucide-react';
import type { TutorialFormData } from '../../types';

// Default form state
const DEFAULT_FORM_DATA: TutorialFormData = {
    title: '',
    description: '',
    video_url: 'https://www.w3schools.com/html/mov_bbb.mp4',
    portal_link: '',
    elearning_link: '',
    target_role: 'STAFF',
};

export function TutorialManager() {
    const { user } = useAuth();
    const { tutorials, isLoading, error, createTutorial, deleteTutorial } = useTutorials();

    // Local UI state only
    const [showAddModal, setShowAddModal] = useState(false);
    const [formData, setFormData] = useState<TutorialFormData>(DEFAULT_FORM_DATA);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Handle form submission
    const handleAddTutorial = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        const success = await createTutorial(formData, user?.id);

        if (success) {
            setShowAddModal(false);
            setFormData(DEFAULT_FORM_DATA);
        }

        setIsSubmitting(false);
    };

    // Handle delete with confirmation
    const handleDeleteTutorial = async (id: string, title: string) => {
        if (!confirm('Are you sure you want to delete this tutorial?')) {
            return;
        }

        await deleteTutorial(id, title);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-lg font-bold text-slate-800">Tutorial Content</h3>
                    <p className="text-sm text-slate-500">Configure global repository access rules.</p>
                </div>
                <Button
                    onClick={() => setShowAddModal(true)}
                    leftIcon={<Plus size={18} />}
                    className="shadow-lg shadow-blue-100"
                >
                    New Tutorial
                </Button>
            </div>

            {/* Error Display */}
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-2">
                    <AlertCircle size={18} />
                    <span className="font-medium">{error.message}</span>
                </div>
            )}

            {/* Tutorial List */}
            {isLoading ? (
                <div className="flex justify-center py-12">
                    <LoadingSpinner size="md" message="Loading tutorials..." />
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {tutorials.map((t) => (
                        <div
                            key={t.id}
                            className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between hover:border-slate-900 transition-all group"
                        >
                            <div className="flex items-center gap-5">
                                <div className="w-16 h-12 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center text-slate-400 group-hover:text-slate-900 transition-colors">
                                    <Video size={24} />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <h4 className="font-bold text-slate-800">{t.title}</h4>
                                        <span
                                            className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${t.target_role === 'STAFF'
                                                    ? 'bg-blue-100 text-blue-600'
                                                    : 'bg-emerald-100 text-emerald-600'
                                                }`}
                                        >
                                            {t.target_role}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-400 font-medium truncate max-w-xl">
                                        {t.description}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button className="p-2 text-slate-400 hover:text-slate-900 rounded-lg">
                                    <Settings size={18} />
                                </button>
                                <button
                                    onClick={() => handleDeleteTutorial(t.id, t.title)}
                                    className="p-2 text-slate-300 hover:text-red-500 rounded-lg"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    ))}

                    {tutorials.length === 0 && (
                        <div className="text-center py-12 text-slate-400">
                            <Video size={48} className="mx-auto mb-4 opacity-50" />
                            <p className="font-medium">No tutorials yet</p>
                            <p className="text-sm">Click "New Tutorial" to add your first one.</p>
                        </div>
                    )}
                </div>
            )}

            {/* Add Tutorial Modal */}
            <Modal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                title="New Tutorial Entry"
                size="lg"
            >
                <form onSubmit={handleAddTutorial} className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                        <div className="col-span-2">
                            <Input
                                label="Tutorial Title"
                                required
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                placeholder="e.g., Staff Grading System"
                            />
                        </div>
                        <div className="col-span-2">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                                Description
                            </label>
                            <textarea
                                rows={2}
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-slate-900 font-medium transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                                Target Audience
                            </label>
                            <select
                                value={formData.target_role}
                                onChange={(e) =>
                                    setFormData({ ...formData, target_role: e.target.value as 'STAFF' | 'STUDENT' })
                                }
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-slate-900 font-bold transition-all"
                            >
                                <option value="STAFF">Staff Only</option>
                                <option value="STUDENT">Student Only</option>
                            </select>
                        </div>
                        <div>
                            <Input
                                label="Video URL"
                                type="url"
                                value={formData.video_url}
                                onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="flex gap-4 pt-4">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => setShowAddModal(false)}
                            className="flex-1"
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            className="flex-1 shadow-xl shadow-blue-100"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Creating...' : 'Create Tutorial'}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}

export default TutorialManager;
