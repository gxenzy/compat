import React from 'react';
import { Box, Typography, TextField } from '@mui/material';
import { LocalizationProvider, DesktopDatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import OptimizedInput from './OptimizedInput';
import { Audit } from './types';

interface IntroductionSectionProps {
  selectedAudit: Audit;
  updateAuditField: (field: string, floor: string, standard: string, value: any) => void;
}

const IntroductionSection: React.FC<IntroductionSectionProps> = ({ selectedAudit, updateAuditField }) => {
  return (
    <Box sx={{
      p: 3,
      display: 'grid',
      gap: 3,
      '@media print': {
        padding: '16px',
        width: '100%',
        maxWidth: '210mm',
        margin: '0 auto',
      },
    }}>
      <Box sx={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 3,
        maxWidth: '800px',
        width: '100%',
        margin: '0 auto',
      }}>
        <Box>
          <Typography variant="subtitle2" fontWeight="bold">Date</Typography>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DesktopDatePicker
              format="MM/dd/yyyy"
              value={selectedAudit.date ? new Date(selectedAudit.date) : null}
              onChange={newValue => {
                if (newValue instanceof Date && !isNaN(newValue.getTime())) {
                  updateAuditField('date', '', '', newValue.toISOString());
                }
              }}
              slotProps={{ textField: params => ({ ...params, size: 'small' }) }}
              sx={{
                '& .MuiInputBase-root': {
                  backgroundColor: 'white',
                  height: '32px',
                },
              }}
            />
          </LocalizationProvider>
        </Box>
        <OptimizedInput
          label="Inspector"
          value={selectedAudit.inspector || ''}
          onChange={value => updateAuditField('inspector', '', '', value)}
          multiline
          rows={2}
          className="print-inspector"
        />
        <OptimizedInput
          label="Location"
          value={selectedAudit.location || ''}
          onChange={value => updateAuditField('location', '', '', value)}
          multiline
          rows={2}
          className="print-location"
        />
      </Box>
      <Box sx={{
        maxWidth: '210mm',
        width: '100%',
        margin: '0 auto',
        '@media print': {
          width: '100%',
          maxWidth: '100%',
          pageBreakInside: 'auto',
          breakInside: 'auto',
        },
      }}>
        <Box className="print-comments-wrapper" sx={{
          '@media print': {
            width: '100%',
            position: 'relative',
            pageBreakInside: 'auto',
            breakInside: 'auto',
            display: 'block',
          },
        }}>
          <OptimizedInput
            label="Comments"
            value={selectedAudit.comments || ''}
            onChange={value => updateAuditField('comments', '', '', value)}
            multiline
            rows={6}
            className="print-comments"
          />
        </Box>
      </Box>
    </Box>
  );
};

export default React.memo(IntroductionSection); 