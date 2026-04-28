import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { AlertCircle, ChevronDown, ChevronUp, CheckCircle, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

export default function OverduePaymentsBadge({ payments, beneficiaries }) {
  const [expanded, setExpanded] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const overduePayments = payments.filter(p => p.status === 'missed' || p.status === 'late');

  const markReceivedMutation = useMutation({
    mutationFn: (id) => base44.entities.Payment.update(id, { status: 'received', received_date: new Date().toISOString().split('T')[0] }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['payments'] }),
  });

  const handleClearOne = (payment) => {
    markReceivedMutation.mutate(payment.id);
    toast({ title: `Payment for ${payment.beneficiary_name || 'beneficiary'} marked as received.` });
  };

  const handleClearAll = async () => {
    await Promise.all(overduePayments.map(p =>
      base44.entities.Payment.update(p.id, { status: 'received', received_date: new Date().toISOString().split('T')[0] })
    ));
    queryClient.invalidateQueries({ queryKey: ['payments'] });
    toast({ title: `${overduePayments.length} payments marked as received.` });
  };

  if (overduePayments.length === 0) return null;

  return (
    <Card className="border-red-200 bg-red-50 mb-6">
      <CardContent className="p-4">
        {/* Header row */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-100 rounded-lg flex-shrink-0">
            <AlertCircle className="w-5 h-5 text-red-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-red-800">
                {overduePayments.length} Overdue Payment{overduePayments.length > 1 ? 's' : ''}
              </p>
              <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold bg-red-600 text-white rounded-full">
                {overduePayments.length}
              </span>
            </div>
            <p className="text-xs text-red-700 mt-0.5">Beneficiaries with missed or late COBRA payments</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              size="sm"
              variant="outline"
              className="text-xs h-7 border-red-300 text-red-700 hover:bg-red-100"
              onClick={handleClearAll}
              disabled={markReceivedMutation.isPending}
            >
              <CheckCircle className="w-3.5 h-3.5 mr-1" />
              Mark All Received
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-xs h-7 text-red-700 hover:bg-red-100 px-2"
              onClick={() => setExpanded(e => !e)}
            >
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Expanded payment list */}
        {expanded && (
          <div className="mt-3 space-y-2">
            {overduePayments.map(p => (
              <div key={p.id} className="flex items-center gap-3 bg-white border border-red-100 rounded-lg px-3 py-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800">{p.beneficiary_name || '—'}</p>
                  <p className="text-xs text-muted-foreground">
                    {p.client_name && <span>{p.client_name} · </span>}
                    ${p.amount?.toFixed(2) || '0.00'}
                    {p.due_date && <span> · Due {new Date(p.due_date).toLocaleDateString()}</span>}
                    <span className={`ml-1.5 px-1.5 py-0.5 rounded text-xs font-medium ${p.status === 'missed' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                      {p.status}
                    </span>
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs h-7 border-emerald-300 text-emerald-700 hover:bg-emerald-50 flex-shrink-0"
                  onClick={() => handleClearOne(p)}
                  disabled={markReceivedMutation.isPending}
                >
                  <CheckCircle className="w-3.5 h-3.5 mr-1" />
                  Mark Received
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}