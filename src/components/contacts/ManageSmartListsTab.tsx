import React, { useEffect } from 'react';
import axios from 'axios';
import { FaGlobe, FaUser, FaUsers } from 'react-icons/fa'; // Using react-icons/fa as seen in page.tsx
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { showError, showSuccess } from '@/lib/toast';

interface SmartList {
  id: string;
  listName: string;
  filterSpecs: any;
}

const ManageSmartListsTab: React.FC = () => {
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [smartLists, setSmartLists] = React.useState<SmartList[]>([]);
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
  const [smartListToEdit, setSmartListToEdit] = React.useState<SmartList | null>(null);

  const fetchSmartLists = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await axios.get(`/api/contacts/smartlist`);
      const smartLists: SmartList[] = result.data.smartLists.map((smartList: any) => ({
        id: smartList.id,
        listName: smartList.listName,
        filterSpecs: smartList.filterSpecs,
      }));

      setSmartLists(smartLists);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching smart lists:', err);
      setError('Failed to fetch smart lists');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSmartLists();
  }, []);

  // smart list is the exact payload just with changed named..
  const editSmartList = async (smartList: SmartList) => {
    try {
      const result = await axios.put(`/api/contacts/smartlist`, smartList);
      fetchSmartLists(); // Re-fetch for simplicity
      showSuccess('Smart list updated successfully');
      return result.data;
    } catch (err) {
      console.error('Error editing smart list:', err); 
      toast.error('Failed to edit smart list');
      return null;
    }
  };

  const deleteSmartList = async (id: string) => {
    try {
      const result = await axios.post(`/api/contacts/smartlist/delete`, { id });
      // Remove from list locally or re-fetch
      setSmartLists(prev => prev.filter(list => list.id !== id));
      showSuccess('Smart list deleted successfully');
      return result.data;
    } catch (err) {
      console.error('Error deleting smart list:', err); 
      showError('Failed to delete smart list');
      return null;
    }
  };

  const handleEditClick = (smartList: SmartList) => {
    setSmartListToEdit(smartList);
    setIsEditModalOpen(true);
  };

  const handleDeleteClick = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this smart list?')) {
      await deleteSmartList(id);
    }
  };

  // Edit Name Modal Component
  const EditSmartListNameModal: React.FC<{ isOpen: boolean; onClose: () => void; smartList: SmartList; onSave: (updatedList: SmartList) => void }> = ({ isOpen, onClose, smartList, onSave }) => {
    const [listName, setListName] = React.useState(smartList.listName);

    React.useEffect(() => {
      setListName(smartList.listName);
    }, [smartList]);

    const handleSave = () => {
      if (listName.trim() === '') {
        toast.error('Smart list name cannot be empty');
        return;
      }
      onSave({ ...smartList, listName });
      onClose();
    };

    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit Smart List Name</h3>
          <div className="mb-4">
            <label htmlFor="smartListName" className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              id="smartListName"
              value={listName}
              onChange={(e) => setListName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              placeholder="Enter name"
            />
          </div>
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold text-gray-900 mb-6">Smart Lists</h2>

      {loading ? (
        <p className="text-gray-500">Loading smart lists...</p>
      ) : error ? (
        <div className="text-red-600">{error}</div>
      ) : smartLists.length === 0 ? (
        <p className="text-gray-500">No smart lists found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 shadow-sm rounded-lg overflow-hidden">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">List Name</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {smartLists.map((list) => (
                <tr key={list.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{list.listName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end items-center space-x-4">
                      <button
                        onClick={() => handleEditClick(list)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Edit Name"
                      >
                         <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(list.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete List"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit Smart List Name Modal */}
      {isEditModalOpen && smartListToEdit && (
        <EditSmartListNameModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          smartList={smartListToEdit}
          onSave={editSmartList}
        />
      )}
    </div>
  );
};

export default ManageSmartListsTab; 