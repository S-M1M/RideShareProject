import { useState, useEffect } from "react";
import { api } from "../../utils/api";

const BuyStars = () => {
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState([]);

  // Star packages
  const starPackages = [
    { stars: 50, label: "Starter Pack", icon: "⭐" },
    { stars: 100, label: "Basic Pack", icon: "⭐⭐" },
    { stars: 250, label: "Premium Pack", icon: "⭐⭐⭐" },
    { stars: 500, label: "Mega Pack", icon: "✨" },
    { stars: 1000, label: "Ultimate Pack", icon: "🌟" },
  ];

  useEffect(() => {
    fetchBalance();
    fetchTransactions();
  }, []);

  const fetchBalance = async () => {
    try {
      const response = await api.get("/users/stars/balance");
      setBalance(response.data.stars);
    } catch (error) {
      console.error("Error fetching balance:", error);
    }
  };

  const fetchTransactions = async () => {
    try {
      const response = await api.get("/users/stars/transactions");
      setTransactions(response.data);
    } catch (error) {
      console.error("Error fetching transactions:", error);
    }
  };

  const handleBuyStars = async (amount) => {
    try {
      setLoading(true);
      await api.post("/users/stars/buy", { amount });
      await fetchBalance();
      await fetchTransactions();
      alert(`Successfully purchased ${amount} stars!`);
    } catch (error) {
      console.error("Error buying stars:", error);
      alert("Failed to purchase stars. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="p-6">
      {/* Balance Card */}
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg shadow-lg p-8 mb-8 text-white">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2">Your Stars Balance</h2>
          <div className="text-6xl font-bold mb-2">⭐ {balance}</div>
          <p className="text-purple-100">Use stars to purchase subscriptions</p>
        </div>
      </div>

      {/* Star Packages */}
      <div className="mb-8">
        <h3 className="text-2xl font-bold mb-4">Buy Stars</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {starPackages.map((pkg) => (
            <div
              key={pkg.stars}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
            >
              <div className="text-center">
                <div className="text-4xl mb-2">{pkg.icon}</div>
                <h4 className="font-semibold text-lg mb-2">{pkg.label}</h4>
                <div className="text-3xl font-bold text-purple-600 mb-4">
                  {pkg.stars}
                </div>
                <button
                  onClick={() => handleBuyStars(pkg.stars)}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-2 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Processing..." : "Buy Now"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Transaction History */}
      <div>
        <h3 className="text-2xl font-bold mb-4">Transaction History</h3>
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {transactions.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              No transactions yet. Buy stars to get started!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Balance After
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {transactions.map((transaction) => (
                    <tr key={transaction._id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(transaction.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
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
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {transaction.description}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <span
                          className={
                            transaction.type === "purchase" || transaction.type === "refund"
                              ? "text-green-600"
                              : "text-red-600"
                          }
                        >
                          {transaction.type === "purchase" || transaction.type === "refund"
                            ? "+"
                            : "-"}
                          {transaction.amount}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {transaction.balanceAfter}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BuyStars;
