import React, { useState } from 'react';
import { Asset, AssetClass, User, GloveSize, GloveColor } from '../../types';
import Button from '../ui/Button';

interface AssetFormProps {
  users: User[];
  initialData?: Partial<Asset>;
  onSubmit: (data: Partial<Asset>) => void;
  onCancel?: () => void;
  isSubmitting?: boolean;
}

const AssetForm: React.FC<AssetFormProps> = ({
  users,
  initialData = {},
  onSubmit,
  onCancel,
  isSubmitting = false,
}) => {
  const [formData, setFormData] = useState<Partial<Asset>>({
    serial_number: '',
    asset_class: 'Class 1',
    assigned_user_id: null,
    issue_date: new Date().toISOString().substring(0, 10),
    last_certification_date: new Date().toISOString().substring(0, 10),
    glove_size: undefined,
    glove_color: undefined,
    ...initialData,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value === '' ? null : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const assetClasses: AssetClass[] = ['Class 0', 'Class 00', 'Class 1', 'Class 2', 'Class 3', 'Class 4'];
  const gloveSizes: GloveSize[] = ['7', '8', '9', '10', '11', '12'];
  const gloveColors: GloveColor[] = ['red', 'yellow', 'black', 'beige'];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <label htmlFor="serial_number" className="block text-sm font-medium text-gray-700">
            Serial Number / Asset ID *
          </label>
          <input
            type="text"
            id="serial_number"
            name="serial_number"
            required
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            value={formData.serial_number || ''}
            onChange={handleChange}
          />
        </div>

        <div>
          <label htmlFor="asset_class" className="block text-sm font-medium text-gray-700">
            Asset Class *
          </label>
          <select
            id="asset_class"
            name="asset_class"
            required
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            value={formData.asset_class || ''}
            onChange={handleChange}
          >
            <option value="">Select Class</option>
            {assetClasses.map(cls => (
              <option key={cls} value={cls}>
                {cls}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="glove_size" className="block text-sm font-medium text-gray-700">
            Glove Size
          </label>
          <select
            id="glove_size"
            name="glove_size"
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            value={formData.glove_size || ''}
            onChange={handleChange}
          >
            <option value="">Select Size</option>
            {gloveSizes.map(size => (
              <option key={size} value={size}>
                Size {size}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="glove_color" className="block text-sm font-medium text-gray-700">
            Glove Color
          </label>
          <select
            id="glove_color"
            name="glove_color"
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            value={formData.glove_color || ''}
            onChange={handleChange}
          >
            <option value="">Select Color</option>
            {gloveColors.map(color => (
              <option key={color} value={color} className="capitalize">
                {color}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="assigned_user_id" className="block text-sm font-medium text-gray-700">
            Assigned To
          </label>
          <select
            id="assigned_user_id"
            name="assigned_user_id"
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            value={formData.assigned_user_id || ''}
            onChange={handleChange}
          >
            <option value="">Unassigned</option>
            {users
              .filter(user => user.role === 'technician')
              .map(user => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
          </select>
        </div>

        <div>
          <label htmlFor="issue_date" className="block text-sm font-medium text-gray-700">
            Issue Date *
          </label>
          <input
            type="date"
            id="issue_date"
            name="issue_date"
            required
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            value={formData.issue_date?.substring(0, 10) || ''}
            onChange={handleChange}
          />
        </div>

        <div>
          <label htmlFor="last_certification_date" className="block text-sm font-medium text-gray-700">
            Last Certification Date *
          </label>
          <input
            type="date"
            id="last_certification_date"
            name="last_certification_date"
            required
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            value={formData.last_certification_date?.substring(0, 10) || ''}
            onChange={handleChange}
          />
        </div>

        {formData.status === 'failed' && (
          <div>
            <label htmlFor="failure_reason" className="block text-sm font-medium text-gray-700">
              Failure Reason *
            </label>
            <textarea
              id="failure_reason"
              name="failure_reason"
              required
              rows={3}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              value={formData.failure_reason || ''}
              onChange={handleChange}
              placeholder="Describe the reason for failure..."
            />
          </div>
        )}
      </div>

      <div className="flex justify-end space-x-3">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
          >
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          isLoading={isSubmitting}
          disabled={isSubmitting}
        >
          {initialData.id ? 'Update Asset' : 'Create Asset'}
        </Button>
      </div>
    </form>
  );
};

export default AssetForm;