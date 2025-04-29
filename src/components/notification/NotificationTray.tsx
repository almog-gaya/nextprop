import React from "react";

import { BellIcon, PhoneIcon, ChatBubbleBottomCenterIcon, TrashIcon } from "@heroicons/react/24/outline";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebaseConfig";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import { Timestamp } from "firebase/firestore";
import { toast } from "react-hot-toast";

interface Notification {
  id: string;
  createdAt: Timestamp;
  type: string;
  read: boolean;
  data: {
    message?: string;
    opportunityName?: string;
    phoneNumber?: string;
    opportunityId?: string;
    pipelineId?: string;
    pipelineName?: string; 
  };
}

interface NotificationTrayProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationTray({ isOpen, onClose }: NotificationTrayProps) {
  const { user } = useAuth();
  const [notifications, setNotifications] = React.useState<Notification[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [pendingDelete, setPendingDelete] = React.useState<Notification | null>(null);

  React.useEffect(() => {
    if (isOpen && user?.locationId) {
      fetchNotifications();
    }
  }, [isOpen, user?.locationId]);

  const fetchNotifications = async () => {
    if (!user?.locationId) return;

    try {
      const notificationsRef = collection(db, "app-notifications", user.locationId, "notifications");
      const notificationsSnapshot = await getDocs(notificationsRef);
      const notificationsData = notificationsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Notification[];

      const sortedNotifications = notificationsData.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());

      setNotifications(sortedNotifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      toast.error("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: Timestamp) => {
    try {
      const date = timestamp.toDate();
      return date.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Invalid date";
    }
  };

  const renderNotificationContent = (notification: Notification) => {
    switch (notification.type) {
      case "newSMS":
        return (
          <>
            <p className="text-xs font-medium text-gray-900 truncate">SMS from {notification.data.opportunityName}</p>
            <p className="text-[11px] text-gray-600 line-clamp-2">{notification.data.message}</p>
            {notification.data.phoneNumber && <p className="text-[10px] text-gray-500">{notification.data.phoneNumber}</p>}
          </>
        );
      case "newCall":
        return (
          <>
            <p className="text-xs font-medium text-gray-900 truncate">Call from {notification.data.opportunityName}</p>
            {notification.data.phoneNumber && <p className="text-[10px] text-gray-500">{notification.data.phoneNumber}</p>}
          </>
        );
      case "leadStatusChange":
        return (
          <>
            <p className="text-xs font-medium text-gray-900 truncate">Lead Status</p>
            <p className="text-[11px] text-gray-600">{notification.data.opportunityName}'s status updated</p>
          </>
        );
      case "newLeadAssigned":
        return (
          <>
            <p className="text-xs font-medium text-gray-900 truncate">New Lead</p>
            <p className="text-[11px] text-gray-600">{notification.data.opportunityName} assigned</p>
          </>
        );
      default:
        return <p className="text-[11px] text-gray-600 line-clamp-2">{notification.data.message}</p>;
    }
  };

  const renderNotificationIcon = (notification: Notification) => {
    switch (notification.type) {
      case "newSMS":
        return <ChatBubbleBottomCenterIcon className="h-4 w-4 text-indigo-500" />;
      case "newCall":
        return <PhoneIcon className="h-4 w-4 text-indigo-500" />;
        
    } 
  }

  const onTapNotification = (notification: Notification) => {
    switch (notification.type) {
      case "newSMS":
        console.log(notification);
        break;
      case "newCall":
        console.log(notification);
        break;
      case "leadStatusChange":
        console.log(notification);
        break;
      case "newLeadAssigned":
        console.log(notification);
        break;
    }
  }

  const handleDeleteNotification = async (notificationId: string) => {
    if (!user?.locationId) return;
    
    try {
      const notificationRef = doc(db, "app-notifications", user.locationId, "notifications", notificationId);
      await deleteDoc(notificationRef);
      setNotifications(notifications.filter(n => n.id !== notificationId));
      toast.success("Notification deleted");
    } catch (error) {
      console.error("Error deleting notification:", error);
      toast.error("Failed to delete notification");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed right-4 top-16 w-80 bg-white rounded-xl shadow-2xl z-50 overflow-hidden transition-all duration-300 ease-in-out p-4">
      {/* Tooltip pointer */}
      <div 
        className="absolute right-[53px] -top-2 w-3 h-3 bg-white transform rotate-45 border-t border-l border-gray-200 shadow-[-1px_-1px_1px_0_rgba(0,0,0,0.1)]"
      />
      {/* Header */}
      <div className="flex justify-between items-center px-4 pt-3 pb-2 border-b">
        <div className="flex items-center">
          <h2 className="text-[9px] font-medium text-gray-900">Notifications</h2>
        </div>
      </div>
      
      <div className="max-h-96 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-2">
            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-indigo-600"></div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-2 text-center text-gray-500 text-sm">No notifications</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {notifications.map((notification) => (
              <div 
                key={notification.id} 
                className="p-1.5 transition-colors duration-150 cursor-pointer group hover:bg-gray-50"
                onClick={() => onTapNotification(notification)}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    {renderNotificationIcon(notification)}
                  </div>
                  <div className="flex-1 min-w-0">
                    {renderNotificationContent(notification)}
                    <p className="text-[10px] text-gray-400 mt-0.5">{formatDate(notification.createdAt)}</p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setPendingDelete(notification);
                    }}
                    className="p-1 hover:bg-gray-100 rounded-full border border-red-300 bg-white"
                  >
                    <TrashIcon className="h-4 w-4 text-red-500" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {pendingDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white rounded-lg shadow-lg p-6 w-80">
            <h3 className="text-base font-semibold mb-2">Delete Notification?</h3>
            <p className="text-sm text-gray-600 mb-4">Are you sure you want to delete this notification?</p>
            <div className="flex justify-end gap-2">
              <button
                className="px-3 py-1 rounded bg-gray-100 text-gray-700 hover:bg-gray-200"
                onClick={() => setPendingDelete(null)}
              >
                Cancel
              </button>
              <button
                className="px-3 py-1 rounded bg-red-500 text-white hover:bg-red-600"
                onClick={async () => {
                  await handleDeleteNotification(pendingDelete.id);
                  setPendingDelete(null);
                }}
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
