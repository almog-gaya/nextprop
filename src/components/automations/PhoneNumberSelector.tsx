interface PhoneNumberSelectorProps {
    selectedPhoneNumber: string;
    onPhoneNumberChange: (phoneNumber: string) => void;
    phoneNumbers: string[];
    isDisabled?: boolean;
  }
  
  export default function PhoneNumberSelector({
    selectedPhoneNumber,
    onPhoneNumberChange,
    phoneNumbers,
    isDisabled = false
  }: PhoneNumberSelectorProps) {
    return (
      <div className="border border-gray-200 rounded-md p-4 bg-gray-50">
        <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-2">
          Select From Number
        </label>
        <select
          id="phoneNumber"
          className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm rounded-md bg-white"
          value={selectedPhoneNumber}
          onChange={(e) => onPhoneNumberChange(e.target.value)}
          disabled={isDisabled}
        >
          <option value="" className="text-gray-500">Select a number</option>
          {phoneNumbers.map((phone) => (
            <option key={phone} value={phone} className="text-gray-900">
              {phone}
            </option>
          ))}
        </select>
      </div>
    );
  }