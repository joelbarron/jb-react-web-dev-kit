import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Slider from '@mui/material/Slider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import { useEffect, useMemo, useState } from 'react';
import Cropper, { Area, Point } from 'react-easy-crop';

import { JBImageCropDialogProps } from './types';

export function JBImageCropDialog(props: JBImageCropDialogProps) {
  const { open, imageSrc, config, processing = false, onCancel, onConfirm } = props;

  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState<number>(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const minZoom = Number(config.minZoom ?? 1);
  const maxZoom = Number(config.maxZoom ?? 3);
  const resolvedAspect = Number(config.aspect ?? 1);
  const canConfirm = Boolean(croppedAreaPixels) && !processing;

  useEffect(() => {
    if (!open) {
      return;
    }
    setCrop({ x: 0, y: 0 });
    setZoom(minZoom);
    setCroppedAreaPixels(null);
  }, [minZoom, open, imageSrc]);

  const cropperProps = useMemo(() => {
    if (config.allowFreeAspect) {
      return {};
    }
    return {
      aspect: resolvedAspect
    };
  }, [config.allowFreeAspect, resolvedAspect]);

  return (
    <Dialog
      open={open}
      onClose={processing ? undefined : onCancel}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle>{config.title || 'Ajustar imagen'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <Box
            sx={{
              position: 'relative',
              width: '100%',
              height: 320,
              borderRadius: 2,
              overflow: 'hidden',
              bgcolor: 'common.black'
            }}
          >
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              minZoom={minZoom}
              maxZoom={maxZoom}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={(_, nextCroppedAreaPixels) => setCroppedAreaPixels(nextCroppedAreaPixels)}
              {...cropperProps}
            />
          </Box>
          <Stack spacing={1}>
            <Typography variant="caption" color="text.secondary">
              {config.helperText || 'Ajusta el recorte para optimizar la imagen antes de guardarla.'}
            </Typography>
            <Stack direction="row" spacing={2} alignItems="center">
              <Typography variant="body2" sx={{ minWidth: 40 }}>
                Zoom
              </Typography>
              <Slider
                value={zoom}
                min={minZoom}
                max={maxZoom}
                step={0.1}
                onChange={(_, value) => setZoom(Number(value))}
                aria-label="Zoom"
              />
            </Stack>
          </Stack>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel} disabled={processing}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          disabled={!canConfirm}
          onClick={() => {
            if (!croppedAreaPixels) {
              return;
            }
            onConfirm(croppedAreaPixels);
          }}
        >
          {processing ? 'Procesando...' : 'Aplicar recorte'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

