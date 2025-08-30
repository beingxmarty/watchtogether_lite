import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';

const VideoUrlInput = ({
  onVideoLoad,
  isLoading = false,
  className = ''
}) => {
  const [videoUrl, setVideoUrl] = useState('');
  const [error, setError] = useState('');

  const validateYouTubeUrl = (url) => {
    const regex = /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    return regex?.test(url);
  };

  const handleSubmit = (e) => {
    e?.preventDefault();
    setError('');

    if (!videoUrl?.trim()) {
      setError('Please enter a YouTube URL');
      return;
    }

    if (!validateYouTubeUrl(videoUrl)) {
      setError('Please enter a valid YouTube URL');
      return;
    }

    onVideoLoad?.(videoUrl?.trim());
  };

  const handleInputChange = (e) => {
    setVideoUrl(e?.target?.value);
    if (error) {
      setError('');
    }
  };

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-4 ${className}`}>
      <div className="flex items-center space-x-2 mb-3">
        <Icon name="Youtube" size={20} className="text-red-500" />
        <h3 className="font-semibold text-gray-900">Load YouTube Video</h3>
      </div>
      <form onSubmit={handleSubmit} className="space-y-3">
        <Input
          type="url"
          placeholder="https://www.youtube.com/watch?v=..."
          value={videoUrl}
          onChange={handleInputChange}
          error={error}
          disabled={isLoading}
          className="w-full"
        />

        <Button
          type="submit"
          variant="default"
          disabled={!videoUrl?.trim() || isLoading}
          loading={isLoading}
          className="w-full"
        >
          {isLoading ? 'Loading Video...' : 'Load Video'}
        </Button>
      </form>
      <div className="mt-3 text-xs text-gray-500">
        <p>• Paste any YouTube video URL to start watching together</p>
        <p>• All viewers will be automatically synchronized</p>
      </div>
    </div>
  );
};

export default VideoUrlInput;