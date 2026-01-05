import React from 'react';
import { Linkedin, Copy, CheckCircle2 } from 'lucide-react';

interface PlatformPreviewProps {
  platform: 'linkedin' | 'twitter' | 'instagram';
  content: string;
  imageUrl?: string; // Optional image URL to display
  onCopy: () => void;
  copied: boolean;
}

// Helper to format content with better line breaks and spacing
const formatContent = (content: string): string => {
  // Split by double newlines for paragraphs
  const paragraphs = content.split(/\n\n+/);
  return paragraphs.join('\n\n');
};

export const LinkedInPreview: React.FC<Omit<PlatformPreviewProps, 'platform'>> = ({ content, imageUrl, onCopy, copied }) => {
  const formattedContent = formatContent(content);
  const lines = formattedContent.split('\n');
  
  return (
    <div className="bg-white rounded-lg shadow-sm overflow-visible w-full">
      {/* LinkedIn Header */}
      <div className="bg-white p-4">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white font-semibold text-sm">U</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <div className="font-semibold text-slate-900 text-[15px]">Your Name</div>
              <svg viewBox="0 0 16 16" className="w-4 h-4 text-blue-600" fill="currentColor">
                <path d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0zm3.5 7.5a.5.5 0 0 1 0 1H5.707l2.147 2.146a.5.5 0 0 1-.708.708l-3-3a.5.5 0 0 1 0-.708l3-3a.5.5 0 1 1 .708.708L5.707 7.5H11.5z"/>
              </svg>
              <div className="text-xs text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">Following</div>
            </div>
            <div className="text-xs text-slate-600 mb-1">Your Title • Startups, Leadership, Product</div>
            <div className="flex items-center gap-1 text-xs text-slate-500">
              <span>18h</span>
              <svg viewBox="0 0 16 16" className="w-3 h-3" fill="currentColor">
                <path d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0zm.5 4.5a.5.5 0 0 0-1 0v3a.5.5 0 0 0 .252.434l3 1.5a.5.5 0 0 0 .496-.868L8.5 7.03V4.5z"/>
              </svg>
            </div>
          </div>
        </div>
      </div>
      
      {/* LinkedIn Content */}
      <div className="px-4 pb-3">
        <div className="text-slate-900 text-[14px] leading-[1.5] font-normal">
          {lines.map((line, index) => {
            // Check if line is a bullet point
            if (line.trim().startsWith('-') || line.trim().startsWith('•')) {
              return (
                <div key={index} className="flex items-start gap-2 mb-1.5">
                  <span className="text-slate-600 mt-0.5">•</span>
                  <span>{line.trim().substring(1).trim()}</span>
                </div>
              );
            }
            // Check if line is a hashtag
            if (line.trim().startsWith('#')) {
              return (
                <div key={index} className="mt-2">
                  <span className="text-blue-600 hover:underline cursor-pointer">{line.trim()}</span>
                </div>
              );
            }
            // Check if line is empty (paragraph break)
            if (line.trim() === '') {
              return <div key={index} className="h-2" />;
            }
            // Regular line
            return (
              <p key={index} className="mb-2 last:mb-0">
                {line}
              </p>
            );
          })}
        </div>
      </div>
      
      {/* LinkedIn Embedded Image */}
      <div className="px-4 pb-3">
        {imageUrl ? (
          <div className="w-full aspect-[16/9] max-h-48 rounded-lg overflow-hidden relative">
            <img
              src={imageUrl}
              alt="LinkedIn post image"
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="w-full aspect-[16/9] max-h-48 bg-gradient-to-br from-slate-100 to-slate-200 rounded-lg flex items-center justify-center relative">
            <div className="text-center">
              <div className="text-xl mb-1 text-slate-400">📷</div>
              <div className="text-xs text-slate-400">Image/Video placeholder</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export const TwitterPreview: React.FC<Omit<PlatformPreviewProps, 'platform'>> = ({ content, onCopy, copied }) => {
  const formattedContent = formatContent(content);
  const lines = formattedContent.split('\n');
  
  return (
    <div className="bg-white rounded-lg shadow-sm overflow-visible w-full">
      {/* X Header */}
      <div className="bg-white p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <div className="w-12 h-12 bg-slate-200 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-slate-600 font-semibold text-sm">U</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <div className="font-bold text-slate-900 text-[15px]">Your Name</div>
                <svg viewBox="0 0 22 22" className="w-5 h-5 text-blue-500" fill="currentColor">
                  <g>
                    <path d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.705 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816zM9.662 14.85l-3.429-3.428 1.394-1.395 2.035 2.036 4.774-4.773 1.394 1.395-6.168 6.168z"/>
                  </g>
                </svg>
                <div className="text-slate-500 text-[15px]">@yourhandle</div>
                <div className="text-slate-500 text-[15px]">·</div>
                <div className="text-slate-500 text-[15px]">15h</div>
              </div>
            </div>
          </div>
          <button className="text-slate-400 hover:text-slate-600 p-1">
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
              <circle cx="5" cy="12" r="2"/>
              <circle cx="12" cy="12" r="2"/>
              <circle cx="19" cy="12" r="2"/>
            </svg>
          </button>
        </div>
      </div>
      
      {/* Twitter Content */}
      <div className="px-4 pb-3">
        <div className="text-slate-900 text-[15px] leading-[1.5] font-normal">
          {lines.map((line, index) => {
            if (line.trim() === '') {
              return <div key={index} className="h-2" />;
            }
            return (
              <p key={index} className="mb-2 last:mb-0">
                {line}
              </p>
            );
          })}
        </div>
      </div>
      
    </div>
  );
};

export const InstagramPreview: React.FC<Omit<PlatformPreviewProps, 'platform'>> = ({ content, imageUrl, onCopy, copied }) => {
  const formattedContent = formatContent(content);
  const lines = formattedContent.split('\n');
  const hashtags: string[] = [];
  const textLines: string[] = [];
  
  // Separate hashtags from text
  lines.forEach(line => {
    if (line.trim().startsWith('#')) {
      hashtags.push(line.trim());
    } else if (line.trim() !== '') {
      textLines.push(line);
    }
  });
  
  return (
    <div className="bg-white rounded-lg shadow-sm overflow-visible w-full">
      {/* Instagram Header */}
      <div className="bg-white p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 rounded-full flex items-center justify-center flex-shrink-0 border-2 border-white">
              <span className="text-white font-semibold text-xs">U</span>
            </div>
            <div>
              <div className="font-semibold text-slate-900 text-sm">yourhandle</div>
              <div className="text-xs text-slate-500">Location</div>
            </div>
          </div>
          <button className="text-slate-400 hover:text-slate-600">
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
              <circle cx="12" cy="12" r="1.5"/>
              <circle cx="12" cy="5" r="1.5"/>
              <circle cx="12" cy="19" r="1.5"/>
            </svg>
          </button>
        </div>
      </div>
      
      {/* Instagram Image */}
      <div className="w-full aspect-square max-h-48 relative">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt="Instagram post image"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-purple-100 via-pink-100 to-orange-100 flex items-center justify-center">
            <div className="text-center">
              <div className="text-lg mb-1">📷</div>
              <div className="text-xs text-slate-500">Image placeholder</div>
            </div>
          </div>
        )}
      </div>
      
      {/* Instagram Caption */}
      <div className="px-4 py-3">
        <div className="text-sm text-slate-900 leading-[1.5]">
          <span className="font-semibold">yourhandle</span>{' '}
          {textLines.length > 0 && (
            <span>{textLines[0]}</span>
          )}
          {textLines.length > 1 && (
            <div className="mt-1">
              {textLines.slice(1).map((line, index) => (
                <p key={index} className="mb-1 last:mb-0">
                  {line}
                </p>
              ))}
            </div>
          )}
          {hashtags.length > 0 && (
            <div className="mt-2 space-y-1">
              {hashtags.map((hashtag, index) => (
                <span key={index} className="text-blue-600 hover:underline cursor-pointer mr-2">
                  {hashtag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const PlatformPreview: React.FC<PlatformPreviewProps> = ({ platform, content, imageUrl, onCopy, copied }) => {
  switch (platform) {
    case 'linkedin':
      return <LinkedInPreview content={content} imageUrl={imageUrl} onCopy={onCopy} copied={copied} />;
    case 'twitter':
      return <TwitterPreview content={content} onCopy={onCopy} copied={copied} />;
    case 'instagram':
      return <InstagramPreview content={content} imageUrl={imageUrl} onCopy={onCopy} copied={copied} />;
    default:
      return null;
  }
};
