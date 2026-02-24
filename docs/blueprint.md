# **App Name**: MediaMerge

## Core Features:

- Image Upload & Preview: Allow users to upload an image file (JPG, PNG, JPEG), display its preview, filename, and size, with options to remove or replace it.
- Video Upload & Preview: Allow users to upload a screen recording video (MP4, WebM), display its preview, filename, and duration, with options to remove or replace it.
- Audio Upload & Preview: Allow users to upload an audio file (MP3, WAV), display its player preview, filename, and duration, with options to remove or replace it.
- Media Combination Engine: Core logic to merge the uploaded image as a thumbnail/cover and combine the uploaded audio with the screen recording into a single output video.
- Combined Output Display & Download: Display a preview of the final combined media and provide a 'Download Final Video' button.
- AI Output Description Tool: A generative AI tool that suggests a compelling title and concise description for the combined video, leveraging insights from the merged media content.
- Input Validation & UI Controls: Implement file type validation, error handling for unsupported/missing files, progress indicators, combine button state management, drag & drop support, and a 'Reset All' option.

## Style Guidelines:

- Background color: A deep, desaturated indigo-blue (#222533), providing a modern and professional dark theme foundation.
- Primary color: A vibrant, professional mid-blue (#4097E8) for interactive elements, buttons, and highlights, ensuring high visibility against the dark background.
- Accent color: A rich, muted purplish-blue (#6949C6) to add depth and visual interest without competing with the primary actions.
- Body and headline font: 'Inter' (sans-serif), chosen for its clean, modern, and highly legible appearance suitable for a professional application.
- Use a set of simple, contemporary line-art or subtly filled icons that complement the clean UI and professional aesthetic.
- Three distinct sections for media upload, presented as cards with drag & drop zones. The combined output section will be prominently displayed at the bottom, all within a responsive design supporting both mobile and desktop views, with a dark mode toggle.
- Incorporate smooth transitions for state changes, file uploads, and a distinct loading animation during the media combination process to enhance user feedback.