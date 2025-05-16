import React from 'react';
import { Shield, Clock, AlertTriangle, CheckCircle, TestTube, XCircle, ArrowRight } from 'lucide-react';
import PageLayout from '../components/layout/PageLayout';

const ProcessStep: React.FC<{
  number: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  isLast?: boolean;
}> = ({ number, title, description, icon, isLast }) => (
  <div className="relative pb-12">
    {!isLast && (
      <div className="absolute left-6 top-14 bottom-0 w-px bg-gray-200"></div>
    )}
    <div className="flex items-start">
      <div className="flex-shrink-0">
        <div className="relative z-10 w-12 h-12 flex items-center justify-center bg-white rounded-full border-2 border-primary-500">
          {icon}
        </div>
      </div>
      <div className="ml-6">
        <div className="flex items-center">
          <span className="bg-primary-100 text-primary-800 text-sm font-medium px-2.5 py-0.5 rounded-full">
            Step {number}
          </span>
        </div>
        <h3 className="mt-2 text-lg font-medium text-gray-900">{title}</h3>
        <p className="mt-1 text-base text-gray-500">{description}</p>
      </div>
    </div>
  </div>
);

const ReminderCard: React.FC<{
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}> = ({ title, description, icon, color }) => (
  <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6`}>
    <div className={`inline-flex items-center justify-center p-2 rounded-lg ${color}`}>
      {icon}
    </div>
    <h3 className="mt-4 text-lg font-medium text-gray-900">{title}</h3>
    <p className="mt-2 text-base text-gray-500">{description}</p>
  </div>
);

const WalkthroughPage: React.FC = () => {
  return (
    <PageLayout
      title="System Walkthrough"
      description="Learn how our glove tracking system works and helps maintain compliance"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Process Flow</h2>
            
            <div className="space-y-8">
              <ProcessStep
                number={1}
                title="Asset Registration"
                description="Add new gloves to the system with details like serial number, class, size, and color. Each asset starts with an 'active' status."
                icon={<Shield className="h-6 w-6 text-primary-600" />}
              />
              
              <ProcessStep
                number={2}
                title="Regular Monitoring"
                description="The system automatically tracks certification dates and updates status based on expiration dates. You'll receive notifications as deadlines approach."
                icon={<Clock className="h-6 w-6 text-primary-600" />}
              />
              
              <ProcessStep
                number={3}
                title="Testing Process"
                description="When an asset is due for testing, mark it as 'in testing' to track its certification progress. This status helps maintain accurate records during the certification process."
                icon={<TestTube className="h-6 w-6 text-primary-600" />}
              />
              
              <ProcessStep
                number={4}
                title="Certification Update"
                description="Upload new certification documents to update the asset status. Successfully certified assets return to 'active' status with updated expiration dates."
                icon={<CheckCircle className="h-6 w-6 text-primary-600" />}
              />
              
              <ProcessStep
                number={5}
                title="Failure Handling"
                description="If an asset fails testing, mark it as 'failed' with a reason. This helps maintain accurate records and ensures failed equipment is removed from service."
                icon={<XCircle className="h-6 w-6 text-primary-600" />}
                isLast
              />
            </div>
          </div>
        </div>
        
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Automatic Reminders</h2>
            <p className="text-gray-500 mb-6">
              The system automatically monitors your assets and provides timely notifications based on certification status:
            </p>
            
            <div className="space-y-4">
              <ReminderCard
                title="30 Days Notice"
                description="Assets approaching certification deadline are marked as 'Due Soon' with amber indicators."
                icon={<Clock className="h-6 w-6 text-warning-600" />}
                color="bg-warning-50"
              />
              
              <ReminderCard
                title="Expiration Alert"
                description="Assets past their certification date are automatically marked as 'Expired' with red indicators."
                icon={<AlertTriangle className="h-6 w-6 text-danger-600" />}
                color="bg-danger-50"
              />
              
              <ReminderCard
                title="Testing Tracking"
                description="Assets in testing are highlighted to ensure certification completion is monitored."
                icon={<TestTube className="h-6 w-6 text-primary-600" />}
                color="bg-primary-50"
              />
            </div>
          </div>
          
          <div className="bg-primary-50 rounded-lg p-6">
            <h3 className="text-lg font-medium text-primary-900 mb-2">Pro Tip</h3>
            <p className="text-primary-700">
              Use the dashboard's quick filters to view assets by status and stay on top of upcoming certifications. The color-coded system helps you quickly identify items needing attention.
            </p>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default WalkthroughPage;