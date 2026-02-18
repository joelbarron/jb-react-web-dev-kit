import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import SaveRoundedIcon from '@mui/icons-material/SaveRounded';
import { Box, Button, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';

import { JBFormHeaderProps } from '../../grid/types';

export function JBFormHeader(props: JBFormHeaderProps) {
  const {
    moduleConfig,
    iconNameRenderer,
    animated = true,
    animationDurationMs = 260,
    animationStaggerMs = 70,
    animationPreset = 'vertical',
    breadcrumb,
    showBackButton = false,
    backLabel,
    onBackClick,
    backContent,
    isNew = false,
    title,
    dynamicTitle,
    formValues,
    getDynamicTitle,
    subtitle,
    dynamicSubtitle,
    getDynamicSubtitle,
    icon,
    actions,
    rightContent
  } = props;

  const dynamicTitleFromResolver = getDynamicTitle?.({ isNew, values: formValues });
  const dynamicSubtitleFromResolver = getDynamicSubtitle?.({ isNew, values: formValues });

  const resolvedTitle =
    (!isNew ? dynamicTitle : undefined) ??
    dynamicTitleFromResolver ??
    title ??
    (isNew ? moduleConfig?.texts?.newText : moduleConfig?.texts?.editText) ??
    moduleConfig?.texts?.moduleName ??
    '';
  const resolvedSubtitle =
    dynamicSubtitle ??
    dynamicSubtitleFromResolver ??
    subtitle ??
    moduleConfig?.texts?.formHeaderSubtitle ??
    '';
  const resolvedBackLabel = backLabel ?? moduleConfig?.texts?.goBackToGrid ?? 'Volver';
  const resolvedIcon =
    icon ??
    (moduleConfig?.texts?.iconName && iconNameRenderer
      ? iconNameRenderer(moduleConfig.texts.iconName)
      : null);
  const defaultActionIcons = {
    save: <SaveRoundedIcon fontSize="small" />,
    cancel: <CloseRoundedIcon fontSize="small" />,
    edit: <EditRoundedIcon fontSize="small" />,
    delete: <DeleteRoundedIcon fontSize="small" />
  };
  const formDisabled = actions?.formDisabled ?? false;
  const allowEdit = actions?.allowEdit ?? false;
  const allowDelete = actions?.allowDelete ?? false;
  const showDeleteWhenEditing = actions?.showDeleteWhenEditing ?? false;

  const defaultActions = actions ? (
    <Box
      sx={{
        display: 'flex',
        gap: 1,
        flexWrap: 'wrap',
        justifyContent: 'flex-end',
        width: { xs: '100%', sm: 'auto' }
      }}>
      {!isNew && allowEdit && formDisabled && actions.onStartEdit ? (
        <Button
          variant="contained"
          color="warning"
          size="large"
          disabled={actions.disableEdit}
          startIcon={actions.editIcon ?? defaultActionIcons.edit}
          sx={(theme) => ({
            borderRadius: 1.5,
            minHeight: 42,
            px: 2.25,
            fontWeight: 700,
            boxShadow: 'none',
            backgroundImage: 'none',
            '&:hover': {
              boxShadow: 'none',
              backgroundImage: 'none',
              backgroundColor: theme.palette.warning.dark
            }
          })}
          onClick={actions.onStartEdit}>
          {actions.editLabel ?? 'Editar'}
        </Button>
      ) : null}

      {(isNew || !formDisabled) && actions.onCancel ? (
        <Button
          variant="outlined"
          size="large"
          disabled={actions.disableCancel}
          startIcon={actions.cancelIcon ?? defaultActionIcons.cancel}
          sx={{ borderRadius: 1.5, minHeight: 42, px: 2.25, fontWeight: 700 }}
          onClick={actions.onCancel}>
          {actions.cancelLabel ?? 'Cancelar'}
        </Button>
      ) : null}

      {(isNew || !formDisabled) && actions.onSave ? (
        <Button
          variant="contained"
          color="primary"
          size="large"
          disabled={actions.disableSave}
          startIcon={actions.saveIcon ?? defaultActionIcons.save}
          sx={(theme) => ({
            borderRadius: 1.5,
            minHeight: 42,
            px: 2.25,
            fontWeight: 700,
            boxShadow: 'none',
            backgroundImage: 'none',
            '&:hover': {
              boxShadow: 'none',
              backgroundImage: 'none',
              backgroundColor: theme.palette.primary.dark
            }
          })}
          onClick={actions.onSave}>
          {actions.saveLabel ?? (isNew ? 'Guardar' : 'Guardar cambios')}
        </Button>
      ) : null}

      {allowDelete &&
      actions.onDelete &&
      (formDisabled || showDeleteWhenEditing) ? (
        <Button
          variant="contained"
          color="error"
          size="large"
          disabled={actions.disableDelete}
          startIcon={actions.deleteIcon ?? defaultActionIcons.delete}
          sx={(theme) => ({
            borderRadius: 1.5,
            minHeight: 42,
            px: 2.25,
            fontWeight: 700,
            boxShadow: 'none',
            backgroundImage: 'none',
            '&:hover': {
              boxShadow: 'none',
              backgroundImage: 'none',
              backgroundColor: theme.palette.error.dark
            }
          })}
          onClick={actions.onDelete}>
          {actions.deleteLabel ?? 'Eliminar'}
        </Button>
      ) : null}
    </Box>
  ) : null;

  const resolvedRightContent = rightContent ?? defaultActions;
  const animateSx = (delayMs: number) =>
    animated
      ? {
          animation: `jbHeaderFadeIn ${animationDurationMs}ms ease-out ${delayMs}ms both`
        }
      : undefined;
  const animateFromLeftSx = (delayMs: number) =>
    animated && animationPreset === 'sides'
      ? {
          animation: `jbHeaderFadeInLeft ${animationDurationMs}ms ease-out ${delayMs}ms both`
        }
      : animateSx(delayMs);
  const animateFromRightSx = (delayMs: number) =>
    animated && animationPreset === 'sides'
      ? {
          animation: `jbHeaderFadeInRight ${animationDurationMs}ms ease-out ${delayMs}ms both`
        }
      : animateSx(delayMs);

  return (
    <Box
      sx={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        p: { xs: 2, sm: 3 },
        '@keyframes jbHeaderFadeIn': {
          from: { opacity: 0, transform: 'translateY(10px)' },
          to: { opacity: 1, transform: 'translateY(0)' }
        },
        '@keyframes jbHeaderFadeInLeft': {
          from: { opacity: 0, transform: 'translateX(-16px)' },
          to: { opacity: 1, transform: 'translateX(0)' }
        },
        '@keyframes jbHeaderFadeInRight': {
          from: { opacity: 0, transform: 'translateX(16px)' },
          to: { opacity: 1, transform: 'translateX(0)' }
        }
      }}>
      {breadcrumb ? <Box sx={animateSx(0)}>{breadcrumb}</Box> : null}
      {backContent ? <Box sx={animateSx(animationStaggerMs)}>{backContent}</Box> : null}
      {showBackButton && onBackClick ? (
        <Typography
          role="button"
          color="text.primary"
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 0.75,
            width: 'fit-content',
            fontWeight: 500,
            fontSize: { xs: '0.95rem', sm: '1rem' },
            cursor: 'pointer',
            opacity: 0.9,
            transition: 'all .16s ease',
            '&:hover': { opacity: 1, color: 'primary.main' },
            ...animateSx(animationStaggerMs * 2)
          }}
          onClick={onBackClick}>
          {`← ${resolvedBackLabel}`}
        </Typography>
      ) : null}

      <Box
        sx={{
          display: { xs: 'flex', sm: 'grid' },
          flexDirection: { xs: 'column', sm: 'row' },
          gridTemplateColumns: { sm: 'minmax(0, 1fr) auto' },
          alignItems: { xs: 'stretch', sm: 'center' },
          width: '100%',
          gap: 2
        }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.25,
            minWidth: 0,
            ...animateFromLeftSx(animationStaggerMs * 3)
          }}>
          {resolvedIcon ? <Box sx={{ display: 'inline-flex', alignItems: 'center' }}>{resolvedIcon}</Box> : null}
          <Box sx={{ minWidth: 0 }}>
            <Typography
              variant="h4"
              sx={{ fontWeight: 700, lineHeight: 1.15 }}>
              {resolvedTitle}
            </Typography>
            {resolvedSubtitle ? (
              <Typography
                variant="h6"
                sx={(theme) => ({
                  mt: 0.4,
                  fontWeight: 600,
                  lineHeight: 1.2,
                  color:
                    theme.palette.mode === 'dark'
                      ? alpha(theme.palette.common.white, 0.9)
                      : theme.palette.primary.dark
                })}>
                {resolvedSubtitle}
              </Typography>
            ) : null}
          </Box>
        </Box>

        <Box
          sx={{
            width: { xs: '100%', sm: 'auto' },
            display: 'flex',
            justifySelf: { sm: 'end' },
            justifyContent: { xs: 'flex-start', sm: 'flex-end' },
            ...animateFromRightSx(animationStaggerMs * 4)
          }}>
          {resolvedRightContent}
        </Box>
      </Box>
    </Box>
  );
}
