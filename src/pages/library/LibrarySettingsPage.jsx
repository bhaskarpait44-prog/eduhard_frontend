import React, { useState, useEffect } from 'react';
import libraryApi from '../../api/libraryApi';
import useToast from '../../hooks/useToast';
import usePageTitle from '../../hooks/usePageTitle';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

const LibrarySettingsPage = () => {
  usePageTitle('Library Settings');
  const { toastSuccess, toastError } = useToast();

  const [settings, setSettings] = useState({
    fine_per_day: 2,
    max_books_per_borrower: 3,
    max_issue_days: 14,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const { data } = await libraryApi.getSettings();
      setSettings({
        fine_per_day: data.fine_per_day || 2,
        max_books_per_borrower: data.max_books_per_borrower || 3,
        max_issue_days: data.max_issue_days || 14,
      });
    } catch (err) {
      toastError('Failed to fetch settings');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings(prev => ({ 
      ...prev, 
      [name]: name === 'fine_per_day' ? parseFloat(value) : parseInt(value, 10) 
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (settings.fine_per_day <= 0) return toastError('Fine per day must be a positive number.');
    if (settings.max_books_per_borrower < 1) return toastError('Max books per borrower must be at least 1.');
    if (settings.max_issue_days < 1) return toastError('Max issue days must be at least 1.');
    setSaving(true);
    try {
      await libraryApi.updateSettings(settings);
      toastSuccess('Library settings updated');
    } catch (err) {
      toastError('Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading settings...</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Library Settings</h1>
        <p className="text-text-muted">Configure library rules and penalties</p>
      </div>

      <div className="bg-surface border border-border rounded-[28px] p-8">
        <form onSubmit={handleSave} className="space-y-6">
          <Input
            label="Fine Per Day (₹)"
            name="fine_per_day"
            type="number"
            step="0.01"
            min="0.01"
            value={settings.fine_per_day}
            onChange={handleChange}
            required
            helperText="Amount charged for each day a book is overdue."
          />

          <Input
            label="Max Books Per Borrower"
            name="max_books_per_borrower"
            type="number"
            min="1"
            value={settings.max_books_per_borrower}
            onChange={handleChange}
            required
            helperText="Maximum number of books a student or staff can have at once."
          />

          <Input
            label="Max Issue Duration (Days)"
            name="max_issue_days"
            type="number"
            min="1"
            value={settings.max_issue_days}
            onChange={handleChange}
            required
            helperText="Default number of days a book is issued for."
          />

          <div className="pt-4">
            <Button variant="primary" type="submit" loading={saving} className="w-full">
              Save Settings
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LibrarySettingsPage;
