import { Box, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';

import { JBButton } from '../buttons';
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
    recordId,
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
  const resolvedDynamicTitle = (!isNew ? dynamicTitle : undefined) ?? dynamicTitleFromResolver;

  const moduleTitle =
    title ??
    (isNew ? moduleConfig?.texts?.newText : moduleConfig?.texts?.editText) ??
    moduleConfig?.texts?.moduleName ??
    '';
  const hasStaticTitle = Boolean(moduleTitle);
  const dynamicSubtitleCandidate =
    dynamicSubtitle ??
    dynamicSubtitleFromResolver ??
    (hasStaticTitle ? resolvedDynamicTitle : undefined);
  const staticSubtitleCandidate =
    subtitle ??
    moduleConfig?.texts?.formHeaderSubtitle ??
    '';
  const baseSubtitle = dynamicSubtitleCandidate ?? staticSubtitleCandidate;
  const recordPrefix = moduleConfig?.texts?.formHeaderRecordPrefix;
  const canApplyRecordPrefix =
    !isNew &&
    Boolean(recordPrefix) &&
    recordId !== undefined &&
    recordId !== null &&
    String(recordId).trim() !== '' &&
    Boolean(dynamicSubtitleCandidate);
  const resolvedTitle =
    (hasStaticTitle ? moduleTitle : undefined) ||
    resolvedDynamicTitle ||
    '';
  const resolvedSubtitle =
    canApplyRecordPrefix
      ? [`${recordPrefix}-${recordId}`, baseSubtitle].filter(Boolean).join(' / ')
      : baseSubtitle;
  const resolvedBackLabel = backLabel ?? moduleConfig?.texts?.goBackToGrid ?? 'Volver';
  const resolvedIcon =
    icon ??
    (moduleConfig?.texts?.iconName && iconNameRenderer
      ? iconNameRenderer(moduleConfig.texts.iconName)
      : null);
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
        <JBButton
          action="edit"
          size="large"
          disabled={actions.disableEdit}
          startIcon={actions.editIcon}
          onClick={actions.onStartEdit}>
          {actions.editLabel ?? 'Editar'}
        </JBButton>
      ) : null}

      {(isNew || !formDisabled) && actions.onCancel ? (
        <JBButton
          action="cancel"
          size="large"
          disabled={actions.disableCancel}
          startIcon={actions.cancelIcon}
          onClick={actions.onCancel}>
          {actions.cancelLabel ?? 'Cancelar'}
        </JBButton>
      ) : null}

      {(isNew || !formDisabled) && actions.onSave ? (
        <JBButton
          action="save"
          size="large"
          disabled={actions.disableSave}
          startIcon={actions.saveIcon}
          onClick={actions.onSave}>
          {actions.saveLabel ?? (isNew ? 'Guardar' : 'Guardar cambios')}
        </JBButton>
      ) : null}

      {allowDelete &&
      actions.onDelete &&
      (formDisabled || showDeleteWhenEditing) ? (
        <JBButton
          action="delete"
          size="large"
          disabled={actions.disableDelete}
          startIcon={actions.deleteIcon}
          onClick={actions.onDelete}>
          {actions.deleteLabel ?? 'Eliminar'}
        </JBButton>
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
              variant="h5"
              sx={{ fontWeight: 700, lineHeight: 1.15 }}>
              {resolvedTitle}
            </Typography>
            {resolvedSubtitle ? (
              <Typography
                variant="body2"
                sx={(theme) => ({
                  mt: 0.4,
                  fontWeight: 500,
                  lineHeight: 1.1,
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
