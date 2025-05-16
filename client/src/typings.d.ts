import  RedirectFunction  from 'react-router-dom';

// This fixes the TypeScript error with spaces in import paths
declare module '*.tsx' {
  const content: any;
  export default content;
}

// Fix the imported declaration for notification center
declare module '*/NotificationCenter' {
  import  RedirectFunction  from 'react-router-dom';
  
  export interface NotificationCenterProps {
    onNavigate: NavigateFunction;
  }
  
  const NotificationCenter: React.FC<NotificationCenterProps>;
  export default NotificationCenter;
} 