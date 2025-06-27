import React, { useState } from 'react';
import { Asset, AssetClass, GloveSize, GloveColor } from '../../types';
import { useAssets } from '../../context/AssetContext';
import Button from '../ui/Button';

interface AssetFormProps {
  initialData?: Partial<Asset>;
  onSubmit: (data: Partial<Asset>) => void;
  onCancel?: () => void;
  isSubmitting?: boolean;
}

const AssetForm: React.FC<AssetFormProps> = ({
  initialData = {},
  onSubmit,
  onCancel,
  isSubmitting = false,
}) => {
  const { organizationMembers } = useAssets();
  const [formData, setFormData] = useState<Partial<Asset>>({
    serialNumber: '',
    assetClass: 'Class 1',
    assignedUserId: null,
    issueDate: new Date().toISOString().substring(0, 10),
    lastCertificationDate: new Date().toISOString().substring(0, 10),
    gloveSize: undefined,
    gloveColor: undefined,
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
          <label htmlFor="serialNumber" className="block text-sm font-medium text-gray-700">
            Serial Number / Asset ID *
          </label>
          <input
            type="text"
            id="serialNumber"
            name="serialNumber"
            required
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            value={formData.serialNumber || ''}
            onChange={handleChange}
          />
        </div>

        <div>
          <label htmlFor="assetClass" className="block text-sm font-medium text-gray-700">
            Asset Class *
          </label>
          <select
            id="assetClass"
            name="assetClass"
            required
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            value={formData.assetClass || ''}
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
          <label htmlFor="gloveSize" className="block text-sm font-medium text-gray-700">
            Glove Size
          </label>
          <select
            id="gloveSize"
            name="gloveSize"
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            value={formData.gloveSize || ''}
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
          <label htmlFor="gloveColor" className="block text-sm font-medium text-gray-700">
            Glove Color
          </label>
          <select
            id="gloveColor"
            name="gloveColor"
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            value={formData.gloveColor || ''}
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
          <label htmlFor="assignedUserId" className="block text-sm font-medium text-gray-700">
            Assigned To
          </label>
          <select
            id="assignedUserId"
            name="assignedUserId"
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            value={formData.assignedUserId || ''}
            onChange={handleChange}
          >
            <option value="">Unassigned</option>
            {organizationMembers.map(member => (
              <option key={member.id} value={member.id}>
                {member.name} ({member.email})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="issueDate" className="block text-sm font-medium text-gray-700">
            Issue Date *
          </label>
          <input
            type="date"
            id="issueDate"
            name="issueDate"
            required
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            value={formData.issueDate?.substring(0, 10) || ''}
            onChange={handleChange}
          />
        </div>

        <div>
          <label htmlFor="lastCertificationDate" className="block text-sm font-medium text-gray-700">
            Last Certification Date *
          </label>
          <input
            type="date"
            id="lastCertificationDate"
            name="lastCertificationDate"
            required
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            value={formData.lastCertificationDate?.substring(0, 10) || ''}
            onChange={handleChange}
          />
        </div>

        {formData.status === 'failed' && (
          <div>
            <label htmlFor="failureReason" className="block text-sm font-medium text-gray-700">
              Failure Reason *
            </label>
            <textarea
              id="failureReason"
              name="failureReason"
              required
              rows={3}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              value={formData.failureReason || ''}
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