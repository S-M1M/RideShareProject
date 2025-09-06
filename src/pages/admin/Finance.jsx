import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { DollarSign, TrendingUp, CreditCard, RefreshCcw } from 'lucide-react';


const Finance = () => {
  const [financialData, setFinancialData] = useState({
    totalRevenue: 0,
    totalRefunds: 0,
    monthlyRevenue: 0,
    activeSubscriptions: 0
  });
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFinancialData();
  }, []);

  const fetchFinancialData = async () => {
    try {
      // In a real app, you'd have specific financial endpoints
      const response = await api.get('/admin/dashboard');
      setFinancialData({
        totalRevenue: response.data.totalRevenue || 0,
        totalRefunds: 0, // Would come from refund calculations
        monthlyRevenue: response.data.totalRevenue || 0,
        activeSubscriptions: response.data.activeSubscriptions || 0
      });
    } catch (error) {
      console.error('Error fetching financial data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout title="Financial Overview">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Financial Overview">
      <div className="space-y-6">
        {/* Financial Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Revenue</p>
                <p className="text-2xl font-semibold text-gray-900">
                  ৳{financialData.totalRevenue.toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <RefreshCcw className="h-8 w-8 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Refunds</p>
                <p className="text-2xl font-semibold text-gray-900">
                  ৳{financialData.totalRefunds.toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingUp className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Monthly Revenue</p>
                <p className="text-2xl font-semibold text-gray-900">
                  ৳{financialData.monthlyRevenue.toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CreditCard className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Active Subscriptions</p>
                <p className="text-2xl font-semibold text-gray-900">{financialData.activeSubscriptions}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Revenue Chart Placeholder */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Revenue Trends</h3>
          <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
            <p className="text-gray-500">Revenue chart would be implemented here with a charting library</p>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Recent Transactions</h3>
          </div>
          <div className="p-6">
            <div className="text-center py-8">
              <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Transaction history would be displayed here</p>
              <p className="text-sm text-gray-400 mt-2">
                Connect to a payment processor to see real transaction data
              </p>
            </div>
          </div>
        </div>

        {/* Refund Management */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Refund Management</h3>
          </div>
          <div className="p-6">
            <div className="text-center py-8">
              <RefreshCcw className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Pending refunds and refund history would be managed here</p>
              <p className="text-sm text-gray-400 mt-2">
                All cancelled rides automatically receive 50% refunds
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Finance;