import React, { useEffect, useState } from 'react';
import {
  Modal,
  Box,
  Fade,
  Backdrop,
  useTheme
} from '@mui/material';
import AccessibilitySettingsPanel from './AccessibilitySettingsPanel';

interface AccessibilitySettingsModalProps {
  open: boolean;
  onClose: () => void;
}

const AccessibilitySettingsModal: React.FC<AccessibilitySettingsModalProps> = ({
  open,
  onClose
}) => {
  const theme = useTheme();
  
  // Add keyboard shortcut support for opening the modal
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Alt+A to toggle accessibility settings
      if (event.altKey && event.key === 'a') {
        // Toggle the modal
        if (open) {
          onClose();
        } else {
          // This would typically call an open method, but since we can't directly
          // modify the 'open' prop, we would need to lift this state management
          // to a parent component
          
          // For this example, we'll just log that the shortcut was pressed
          console.log('Alt+A pressed - would open accessibility settings');
        }
      }
      
      // ESC key to close modal when open
      if (event.key === 'Escape' && open) {
        onClose();
      }
    };
    
    // Add global event listener
    window.addEventListener('keydown', handleKeyDown);
    
    // Clean up event listener on unmount
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose]);
  
  return (
    <Modal
      open={open}
      onClose={onClose}
      closeAfterTransition
      slots={{ backdrop: Backdrop }}
      slotProps={{
        backdrop: {
          timeout: 500,
          sx: {
            backdropFilter: 'blur(3px)',
            backgroundColor: 'rgba(0, 0, 0, 0.5)'
          }
        },
      }}
      aria-labelledby="accessibility-settings-modal"
    >
      <Fade in={open}>
        <Box sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          maxWidth: '90vw',
          maxHeight: '90vh',
          overflow: 'hidden',
          outline: 'none',
          borderRadius: '28px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
          '&:focus': {
            outline: 'none',
          },
        }}>
          <AccessibilitySettingsPanel onClose={onClose} variant="modal" />
        </Box>
      </Fade>
    </Modal>
  );
};

export default AccessibilitySettingsModal; 