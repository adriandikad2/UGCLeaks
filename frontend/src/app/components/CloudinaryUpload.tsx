'use client';

import { CldUploadWidget, CloudinaryUploadWidgetResults } from 'next-cloudinary';
import { useState, useEffect } from 'react';

interface CloudinaryUploadProps {
    onImageChange: (url: string) => void;
    currentImageUrl?: string;
}

/**
 * Image Input Component with two mutually exclusive methods:
 * 1. Cloudinary Upload - upload image to Cloudinary
 * 2. URL Input - paste a direct image URL
 * 
 * When one method has a value, the other is disabled/greyed out.
 */
export default function CloudinaryUpload({ onImageChange, currentImageUrl }: CloudinaryUploadProps) {
    const [isUploading, setIsUploading] = useState(false);
    const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
    const [manualUrl, setManualUrl] = useState<string>('');
    const [error, setError] = useState<string | null>(null);

    // Get environment variables
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

    // Determine which method is active based on current values
    const isManualUrlFilled = manualUrl.length > 0 && !manualUrl.includes('placehold.co');
    const hasCloudinaryUpload = uploadedUrl !== null;

    // Initialize manual URL from currentImageUrl if it's not a Cloudinary URL
    useEffect(() => {
        if (currentImageUrl && !currentImageUrl.includes('cloudinary') && !currentImageUrl.includes('placehold.co')) {
            setManualUrl(currentImageUrl);
        }
    }, [currentImageUrl]);

    const handleUploadSuccess = (result: CloudinaryUploadWidgetResults) => {
        if (result.info && typeof result.info === 'object' && 'secure_url' in result.info) {
            const url = result.info.secure_url as string;
            setUploadedUrl(url);
            setManualUrl(''); // Clear manual URL when uploading
            onImageChange(url);
            setIsUploading(false);
            setError(null);
        }
    };

    const handleManualUrlChange = (url: string) => {
        setManualUrl(url);
        if (url.length > 0) {
            setUploadedUrl(null); // Clear uploaded URL when typing manual URL
            onImageChange(url);
        }
    };

    const handleClearUpload = () => {
        setUploadedUrl(null);
        onImageChange('');
    };

    const handleClearManualUrl = () => {
        setManualUrl('');
        onImageChange('');
    };

    // Determine the current image URL for preview
    const previewUrl = uploadedUrl || (manualUrl.length > 0 ? manualUrl : null);

    // Check if Cloudinary is configured
    const isCloudinaryConfigured = cloudName && uploadPreset && cloudName !== 'your_cloud_name_here';

    return (
        <div className="space-y-4">
            {/* Method 1: Cloudinary Upload */}
            <div className={`p-4 rounded-lg border-2 transition-all ${isManualUrlFilled ? 'opacity-40 pointer-events-none' : ''}`}
                style={{ borderColor: isManualUrlFilled ? '#666' : 'var(--theme-gradient-1)' }}>
                <div className="flex items-center gap-2 mb-3">
                    <span className="text-lg">☁️</span>
                    <span className="font-bold theme-text-primary">Upload to Cloudinary</span>
                    {hasCloudinaryUpload && (
                        <button
                            type="button"
                            onClick={handleClearUpload}
                            className="ml-auto text-red-500 hover:text-red-700 text-sm font-bold"
                        >
                            ✕ Clear
                        </button>
                    )}
                </div>

                {!isCloudinaryConfigured ? (
                    <div className="p-3 rounded-lg bg-yellow-100 border-2 border-yellow-400 text-yellow-800 text-sm">
                        <p className="font-bold">⚠️ Cloudinary not configured</p>
                        <p className="text-xs mt-1">Set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET in .env.local</p>
                    </div>
                ) : (
                    <CldUploadWidget
                        uploadPreset={uploadPreset}
                        options={{
                            maxFiles: 1,
                            resourceType: 'image',
                            folder: 'ugc-leaks',
                            clientAllowedFormats: ['png', 'jpg', 'jpeg', 'gif', 'webp'],
                            maxFileSize: 5000000,
                            cloudName: cloudName,
                        }}
                        onOpen={() => setIsUploading(true)}
                        onClose={() => setIsUploading(false)}
                        onSuccess={handleUploadSuccess}
                        onError={(err) => {
                            setError('Upload failed. Please try again.');
                            setIsUploading(false);
                            console.error('Cloudinary error:', err);
                        }}
                    >
                        {({ open }) => (
                            <button
                                type="button"
                                onClick={() => {
                                    if (open) {
                                        open();
                                    } else {
                                        setError('Upload widget not ready. Please try again.');
                                    }
                                }}
                                disabled={isUploading || isManualUrlFilled}
                                className="w-full px-4 py-3 rounded-lg border-4 font-bold transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                                style={{
                                    borderColor: hasCloudinaryUpload ? '#22c55e' : 'var(--theme-gradient-2)',
                                    background: hasCloudinaryUpload
                                        ? 'linear-gradient(135deg, #22c55e, #16a34a)'
                                        : 'linear-gradient(135deg, var(--theme-gradient-1), var(--theme-gradient-2))',
                                    color: 'white',
                                }}
                            >
                                {isUploading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <span className="animate-spin">⏳</span> Uploading...
                                    </span>
                                ) : hasCloudinaryUpload ? (
                                    <span className="flex items-center justify-center gap-2">
                                        ✅ Uploaded! Click to Replace
                                    </span>
                                ) : (
                                    <span className="flex items-center justify-center gap-2">
                                        📤 Click to Upload Image
                                    </span>
                                )}
                            </button>
                        )}
                    </CldUploadWidget>
                )}

                {error && (
                    <div className="mt-2 p-2 rounded bg-red-100 border border-red-400 text-red-700 text-xs">
                        {error}
                    </div>
                )}
            </div>

            {/* OR Divider */}
            <div className="flex items-center gap-4">
                <div className="flex-1 h-0.5 bg-gray-600"></div>
                <span className="font-bold theme-text-secondary text-sm">OR</span>
                <div className="flex-1 h-0.5 bg-gray-600"></div>
            </div>

            {/* Method 2: Manual URL Input */}
            <div className={`p-4 rounded-lg border-2 transition-all ${hasCloudinaryUpload ? 'opacity-40 pointer-events-none' : ''}`}
                style={{ borderColor: hasCloudinaryUpload ? '#666' : 'var(--theme-gradient-3)' }}>
                <div className="flex items-center gap-2 mb-3">
                    <span className="text-lg">🔗</span>
                    <span className="font-bold theme-text-primary">Paste Image URL</span>
                    {isManualUrlFilled && (
                        <button
                            type="button"
                            onClick={handleClearManualUrl}
                            className="ml-auto text-red-500 hover:text-red-700 text-sm font-bold"
                        >
                            ✕ Clear
                        </button>
                    )}
                </div>
                <input
                    type="url"
                    value={manualUrl}
                    onChange={(e) => handleManualUrlChange(e.target.value)}
                    placeholder="https://tr.rbxcdn.com/... or any image URL"
                    disabled={hasCloudinaryUpload}
                    className="w-full px-4 py-3 rounded-lg border-4 font-bold theme-text-primary focus:outline-none theme-bg-card disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ borderColor: isManualUrlFilled ? '#22c55e' : 'var(--theme-gradient-4)' }}
                />
            </div>

            {/* Image Preview */}
            {previewUrl && (
                <div className="mt-2 p-3 rounded-lg border-2 theme-bg-card" style={{ borderColor: 'var(--theme-gradient-3)' }}>
                    <p className="text-xs font-bold theme-text-secondary mb-2">📷 Preview:</p>
                    <img
                        src={previewUrl}
                        alt="Image preview"
                        className="w-28 h-28 object-contain rounded mx-auto"
                        onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://placehold.co/400x400?text=Invalid+URL';
                        }}
                    />
                </div>
            )}
        </div>
    );
}
