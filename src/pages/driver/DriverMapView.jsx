import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Layout from "../../components/Layout";
import api from "../../utils/api";
import { MapPin, Navigation, CheckCircle } from "lucide-react";

const DriverMapView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [assignment, setAssignment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (id) fetchAssignment();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchAssignment = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/drivers/assignments/${id}`);
      setAssignment(res.data);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  const markStop = async (stopIndex) => {
    if (!assignment) return;

    try {
      // Ensure chronological progression: only allow marking the next stop
      const nextIndex = assignment.currentStopIndex || 0;
      if (stopIndex !== nextIndex) {
        setError("Please progress stops in chronological order");
        return;
      }

      await api.put(`/drivers/assignments/${assignment._id}/progress`, {
        stopIndex,
      });

      await fetchAssignment();
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    }
  };

  if (loading) {
    return (
      <Layout title="Route Map">
        <div className="flex items-center justify-center h-64">Loading...</div>
      </Layout>
    );
  }

  if (!assignment) {
    return (
      <Layout title="Route Map">
        <div className="p-6">{error || "Assignment not found"}</div>
      </Layout>
    );
  }

  const stops = assignment.presetRoute_id?.stops || [];
  // sort stops by order if present
  stops.sort((a, b) => (a.order || 0) - (b.order || 0));

  return (
    <Layout title={`Route: ${assignment.presetRoute_id?.name || "Route"}`}>
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium">
                {assignment.presetRoute_id?.name}
              </h3>
              <p className="text-sm text-gray-600">
                {assignment.presetRoute_id?.description}
              </p>
            </div>
            <div className="text-right text-sm">
              <div>
                Vehicle:{" "}
                {assignment.vehicle_id
                  ? `${assignment.vehicle_id.model} (${assignment.vehicle_id.license_plate})`
                  : "Not assigned"}
              </div>
              <div>Capacity: {assignment.vehicle_id?.capacity || 0} seats</div>
              <div>
                Scheduled: {assignment.scheduledStartTime} on{" "}
                {new Date(assignment.scheduledDate).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h4 className="font-medium mb-4">Route Stops</h4>
          <div className="space-y-3">
            {stops.length === 0 && (
              <div className="text-sm text-gray-500">
                No stops defined for this route.
              </div>
            )}
            {stops.map((stop, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 border rounded"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-medium">
                    {idx + 1}
                  </div>
                  <div>
                    <div className="font-medium">{stop.name}</div>
                    <div className="text-sm text-gray-600">
                      {stop.lat}, {stop.lng}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {assignment.currentStopIndex > idx ? (
                    <span className="text-green-600 font-medium">Reached</span>
                  ) : assignment.currentStopIndex === idx ? (
                    <button
                      onClick={() => markStop(idx)}
                      className="bg-green-600 text-white px-3 py-1 rounded"
                    >
                      Mark Reached
                    </button>
                  ) : (
                    <span className="text-gray-500">Pending</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 border rounded"
          >
            Back
          </button>
          <button
            onClick={async () => {
              try {
                await api.put(`/drivers/assignments/${assignment._id}/status`, {
                  status: "completed",
                });
                await fetchAssignment();
              } catch (err) {
                setError(err.response?.data?.error || err.message);
              }
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            Complete Route
          </button>
        </div>
      </div>
    </Layout>
  );
};

export default DriverMapView;
