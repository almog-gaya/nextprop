import React from "react";

import { BellIcon, PhoneIcon, ChatBubbleBottomCenterIcon, TrashIcon, UserPlusIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebaseConfig";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import { Timestamp } from "firebase/firestore";
import { toast } from "react-hot-toast";
import { CrosshairIcon, CrossIcon, Plus } from "lucide-react";
import { RxCrossCircled } from "react-icons/rx";

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
            <p className="text-xs font-medium text-gray-900 truncate">Lead Status Updated</p>
            <p className="text-[11px] text-gray-600">{notification.data.message}</p>
          </>
        );
      case "newLeadAssigned":
        return (
          <>
            <p className="text-xs font-medium text-gray-900 truncate">New Lead</p>
            <p className="text-[11px] text-gray-600">{notification.data.message}</p>
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
      case "leadStatusChange":
        return <BellIcon className="h-4 w-4 text-indigo-500" />;
      case "newLeadAssigned":
        return <UserPlusIcon className="h-4 w-4 text-indigo-500" />;
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
    <>
      {/* Backdrop with blur effect */}
      <div 
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
        onClick={onClose}
      />
      <div className="fixed right-4 top-16 w-80 bg-white/80 backdrop-blur-md rounded-xl shadow-2xl z-50 overflow-hidden transition-all duration-300 ease-in-out p-4">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-3 top-3 p-1.5 hover:bg-gray-100/50 rounded-full transition-colors flex items-center justify-center"
          aria-label="Close notifications"
        >
          <RxCrossCircled className="h-6 w-6 text-gray-500 hover:text-gray-700" />
        </button>
        
        {/* Header */}
        <div className="flex justify-between items-center px-4 py-3 border-b border-gray-200/50">
          <div className="flex items-center">
            <p className="text-large font-medium text-gray-900 truncate">Notifications</p> 
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
            <div className="divide-y divide-gray-100/50">
              {notifications.map((notification) => (
                <div 
                  key={notification.id} 
                  className="p-1.5 transition-colors duration-150 cursor-pointer group hover:bg-gray-50/50"
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
                      className="p-1 hover:bg-gray-100/50 rounded-full border border-red-300 bg-white/80 backdrop-blur-sm"
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
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
            <div className="bg-white/80 backdrop-blur-md rounded-lg shadow-lg p-6 w-80">
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
    </>
  );
}
