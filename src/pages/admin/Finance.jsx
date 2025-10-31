import React, { useState, useEffect } from "react";
import Layout from "../../components/Layout";
import {
  DollarSign,
  TrendingUp,
  CreditCard,
  RefreshCcw,
  Star,
  ShoppingBag,
  TrendingDown,
} from "lucide-react";
import api from "../../utils/api";

const Finance = () => {
  const [financialData, setFinancialData] = useState({
    totalRevenue: 0,
    totalRefunds: 0,
    monthlyRevenue: 0,
    activeSubscriptions: 0,
  });
  const [starsEconomy, setStarsEconomy] = useState({
    totalStarsInCirculation: 0,
    totalStarsPurchased: 0,
    totalStarsSpent: 0,
    totalStarsRefunded: 0,
    subscriptionsByType: [],
    recentTransactions: [],
  });
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFinancialData();
    fetchStarsEconomy();
  }, []);

  const fetchFinancialData = async () => {
    try {
      // In a real app, you'd have specific financial endpoints
      const response = await api.get("/admin/dashboard");
      setFinancialData({
        totalRevenue: response.data.totalRevenue || 0,
        totalRefunds: 0, // Would come from refund calculations
        monthlyRevenue: response.data.totalRevenue || 0,
        activeSubscriptions: response.data.activeSubscriptions || 0,
      });
    } catch (error) {
      console.error("Error fetching financial data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStarsEconomy = async () => {
    try {
      const response = await api.get("/admin/stars-economy");
      setStarsEconomy(response.data);
    } catch (error) {
      console.error("Error fetching stars economy:", error);
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
                <p className="text-sm font-medium text-gray-500">
                  Total Revenue
                </p>
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
                <p className="text-sm font-medium text-gray-500">
                  Total Refunds
                </p>
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
                <p className="text-sm font-medium text-gray-500">
                  Monthly Revenue
                </p>
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
                <p className="text-sm font-medium text-gray-500">
                  Active Subscriptions
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {financialData.activeSubscriptions}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Stars Economy Section */}
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg shadow p-6 text-white">
          <h3 className="text-2xl font-bold mb-6">⭐ Stars Economy</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white bg-opacity-20 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <Star className="h-6 w-6 mr-2" />
                <p className="text-sm opacity-90">In Circulation</p>
              </div>
              <p className="text-3xl font-bold">
                {starsEconomy.totalStarsInCirculation.toLocaleString()}
              </p>
            </div>
            <div className="bg-white bg-opacity-20 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <ShoppingBag className="h-6 w-6 mr-2" />
                <p className="text-sm opacity-90">Total Purchased</p>
              </div>
              <p className="text-3xl font-bold">
                {starsEconomy.totalStarsPurchased.toLocaleString()}
              </p>
            </div>
            <div className="bg-white bg-opacity-20 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <TrendingDown className="h-6 w-6 mr-2" />
                <p className="text-sm opacity-90">Total Spent</p>
              </div>
              <p className="text-3xl font-bold">
                {starsEconomy.totalStarsSpent.toLocaleString()}
              </p>
            </div>
            <div className="bg-white bg-opacity-20 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <RefreshCcw className="h-6 w-6 mr-2" />
                <p className="text-sm opacity-90">Total Refunded</p>
              </div>
              <p className="text-3xl font-bold">
                {starsEconomy.totalStarsRefunded.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Subscription Revenue by Plan Type */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">
            Active Subscriptions by Plan Type
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {starsEconomy.subscriptionsByType.map((sub) => (
              <div
                key={sub._id}
                className="border-2 border-purple-200 rounded-lg p-4 bg-purple-50"
              >
                <h4 className="font-semibold text-lg capitalize mb-2">
                  {sub._id || "Unknown"} Plan
                </h4>
                <div className="space-y-1">
                  <p className="text-sm text-gray-600">
                    Active Subscriptions: <strong>{sub.count}</strong>
                  </p>
                  <p className="text-sm text-gray-600">
                    Total Revenue:{" "}
                    <strong className="text-purple-600">
                      ⭐ {sub.totalStars.toLocaleString()} stars
                    </strong>
                  </p>
                </div>
              </div>
            ))}
            {starsEconomy.subscriptionsByType.length === 0 && (
              <div className="col-span-3 text-center py-8 text-gray-500">
                No active subscriptions yet
              </div>
            )}
          </div>
        </div>

        {/* Recent Star Transactions */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Recent Star Transactions
            </h3>
          </div>
          <div className="overflow-x-auto">
            {starsEconomy.recentTransactions.length > 0 ? (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Balance After
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {starsEconomy.recentTransactions.map((transaction) => (
                    <tr key={transaction._id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {transaction.user_id?.name || "Unknown"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            transaction.type === "purchase"
                              ? "bg-green-100 text-green-800"
                              : transaction.type === "spend"
                              ? "bg-red-100 text-red-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {transaction.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <span
                          className={
                            transaction.type === "purchase" ||
                            transaction.type === "refund"
                              ? "text-green-600"
                              : "text-red-600"
                          }
                        >
                          {transaction.type === "purchase" ||
                          transaction.type === "refund"
                            ? "+"
                            : "-"}
                          {transaction.amount}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {transaction.description}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {transaction.balanceAfter}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(transaction.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-6 text-center py-8">
                <Star className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No star transactions yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Revenue Chart Placeholder */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Revenue Trends</h3>
          <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
            <p className="text-gray-500">
              Revenue chart would be implemented here with a charting library
            </p>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Recent Transactions
            </h3>
          </div>
          <div className="p-6">
            <div className="text-center py-8">
              <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">
                Transaction history would be displayed here
              </p>
              <p className="text-sm text-gray-400 mt-2">
                Connect to a payment processor to see real transaction data
              </p>
            </div>
          </div>
        </div>

        {/* Refund Management */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Refund Management
            </h3>
          </div>
          <div className="p-6">
            <div className="text-center py-8">
              <RefreshCcw className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">
                Pending refunds and refund history would be managed here
              </p>
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
