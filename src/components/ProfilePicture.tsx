import { useState, useRef } from 'react';
import { API_URL } from '../config';

interface ProfilePictureProps {
  currentPicture?: string;
  token: string;
  onUpdate: (newPicture: string) => void;
}

function ProfilePicture({ currentPicture, token, onUpdate }: ProfilePictureProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('File must be an image');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Convert to base64
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64Image = event.target?.result as string;

        try {
          const response = await fetch(`${API_URL}/api/users/me/profile-picture`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ image: base64Image })
          });

          if (!response.ok) {
            const data = await response.json();
            throw new Error(data.message || 'Failed to update profile picture');
          }

          const data = await response.json();
          onUpdate(data.profilePicture);
          setError(null);
        } catch (error) {
          console.error('Error uploading profile picture:', error);
          setError(error instanceof Error ? error.message : 'Failed to update profile picture');
        } finally {
          setIsLoading(false);
        }
      };

      reader.onerror = () => {
        setError('Error reading file');
        setIsLoading(false);
      };

      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error processing file:', error);
      setError('Error processing file');
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-4">
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-blue-600 dark:bg-blue-700 flex items-center justify-center overflow-hidden">
            {currentPicture ? (
              <img 
                src={currentPicture} 
                alt="Profile" 
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-3xl text-white">
                ?
              </span>
            )}
          </div>
          {isLoading && (
            <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            </div>
          )}
        </div>
        <div>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={handleFileSelect}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className="btn btn-secondary dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
          >
            {currentPicture ? 'Change Picture' : 'Add Picture'}
          </button>
        </div>
      </div>
      {error && (
        <div className="text-sm text-red-500 dark:text-red-400">
          {error}
        </div>
      )}
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Maximum file size: 5MB. Supported formats: JPEG, PNG, GIF
      </p>
    </div>
  );
}

export default ProfilePicture;
