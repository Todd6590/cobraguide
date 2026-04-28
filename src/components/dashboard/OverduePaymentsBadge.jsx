import { Link } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function OverduePaymentsBadge({ payments, beneficiaries }) {
  const overduePayments = payments.filter(p => p.status === 'missed' || p.status === 'late');

  if (overduePayments.length === 0) return null;

  // Get unique beneficiary names with overdue payments
  const overdueBeneficiaryIds = [...new Set(overduePayments.map(p => p.beneficiary_id))];
  const overdueBeneficiaries = overdueBeneficiaryIds
    .map(id => beneficiaries.find(b => b.id === id))
    .filter(Boolean)
    .slice(0, 5);

  return (
    <Card className="border-red-200 bg-red-50 mb-6">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-red-100 rounded-lg flex-shrink-0">
            <AlertCircle className="w-5 h-5 text-red-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-sm font-semibold text-red-800">
                {overduePayments.length} Overdue Payment{overduePayments.length > 1 ? 's' : ''}
              </p>
              <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold bg-red-600 text-white rounded-full">
                {overduePayments.length}
              </span>
            </div>
            <p className="text-xs text-red-700 mb-2">
              The following beneficiaries have missed or late COBRA payments:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {overdueBeneficiaries.map(b => (
                <span key={b.id} className="text-xs bg-red-100 border border-red-200 text-red-800 px-2 py-0.5 rounded-full font-medium">
                  {b.first_name} {b.last_name}
                </span>
              ))}
              {overdueBeneficiaryIds.length > 5 && (
                <span className="text-xs bg-red-100 border border-red-200 text-red-700 px-2 py-0.5 rounded-full">
                  +{overdueBeneficiaryIds.length - 5} more
                </span>
              )}
            </div>
          </div>
          <Link
            to="/payments"
            className="flex-shrink-0 text-xs font-medium text-red-700 hover:text-red-900 underline underline-offset-2"
          >
            View All
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}