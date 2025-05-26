import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, User, FileText, Ruler, Palette } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Asset } from '../../types';
import Card, { CardContent, CardFooter } from '../ui/Card';
import StatusBadge from '../ui/StatusBadge';

interface AssetCardProps {
  asset: Asset;
  userName?: string;
  showActions?: boolean;
}

const AssetCard: React.FC<AssetCardProps> = ({ 
  asset, 
  userName = 'Unassigned',
  showActions = true
}) => {
  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'MMM d, yyyy');
    } catch {
      return dateString;
    }
  };
  
  return (
    <Card className="h-full transition-shadow hover:shadow-md">
      <CardContent className="pt-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-medium text-gray-900">
              <Link to={`/assets/${asset.id}`} className="hover:text-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2">
                {asset.serial_number}
              </Link>
            </h3>
            <p className="text-sm text-gray-500">{asset.asset_class}</p>
          </div>
          <StatusBadge status={asset.status} />
        </div>
        
        <div className="space-y-3">
          {asset.glove_size && (
            <div className="flex items-center text-sm">
              <Ruler className="h-4 w-4 text-gray-400 mr-2" />
              <div>
                <span className="text-gray-500">Size: </span>
                <span className="font-medium">{asset.glove_size}</span>
              </div>
            </div>
          )}
          
          {asset.glove_color && (
            <div className="flex items-center text-sm">
              <Palette className="h-4 w-4 text-gray-400 mr-2" />
              <div>
                <span className="text-gray-500">Color: </span>
                <span className="font-medium capitalize">{asset.glove_color}</span>
              </div>
            </div>
          )}
          
          <div className="flex items-center text-sm">
            <Calendar className="h-4 w-4 text-gray-400 mr-2" />
            <div>
              <span className="text-gray-500">Last Certified: </span>
              <span className="font-medium">{formatDate(asset.last_certification_date)}</span>
            </div>
          </div>
          
          <div className="flex items-center text-sm">
            <Calendar className="h-4 w-4 text-gray-400 mr-2" />
            <div>
              <span className="text-gray-500">Next Due: </span>
              <span className={`font-medium ${asset.status === 'expired' ? 'text-danger-600' : asset.status === 'near-due' ? 'text-warning-600' : ''}`}>
                {formatDate(asset.next_certification_date)}
              </span>
            </div>
          </div>
          
          <div className="flex items-center text-sm">
            <User className="h-4 w-4 text-gray-400 mr-2" />
            <div>
              <span className="text-gray-500">Assigned to: </span>
              <span className="font-medium">{userName}</span>
            </div>
          </div>
          
          <div className="flex items-center text-sm">
            <FileText className="h-4 w-4 text-gray-400 mr-2" />
            <div>
              <span className="text-gray-500">Documents: </span>
              <span className="font-medium">{(asset.certification_documents || []).length}</span>
            </div>
          </div>
        </div>
      </CardContent>
      
      {showActions && (
        <CardFooter className="bg-gray-50 flex justify-between">
          <Link
            to={`/assets/${asset.id}`}
            className="text-sm font-medium text-primary-600 hover:text-primary-700"
          >
            View Details
          </Link>
        </CardFooter>
      )}
    </Card>
  );
};

export default AssetCard;