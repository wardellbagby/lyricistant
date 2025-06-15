import { Text } from '@codemirror/state';
import { DetailPaneChildProps } from '@lyricistant/renderer/detail/DetailPane';
import { NullStateText } from '@lyricistant/renderer/detail/NullStateText';
import {
  Diagnostic,
  diagnosticsMachine,
} from '@lyricistant/renderer/diagnostics/DiagnosticsMachine';
import { Markdown } from '@lyricistant/renderer/markdown/Markdown';
import { ChevronRight } from '@mui/icons-material';
import {
  Box,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemSecondaryAction,
  ListItemText,
  Paper,
  Popover,
  useTheme,
} from '@mui/material';
import { useMachine } from '@xstate/react';
import React, { useEffect } from 'react';

export interface DiagnosticsPanelProps extends DetailPaneChildProps {
  text: Text;
  onDiagnosticsLoaded: (diagnostics: Diagnostic[]) => void;
  onDiagnosticClicked: (value: Diagnostic) => void;
  onProposalAccepted: (proposal: string, diagnostic: Diagnostic) => void;
}

export const Diagnostics = (props: DiagnosticsPanelProps) => {
  const [state, send] = useMachine(diagnosticsMachine);

  useEffect(() => {
    if (props.isVisible) {
      send({ type: 'INPUT', input: props.text });
    }
  }, [props.text, props.isVisible]);

  useEffect(() => {
    props.onLoadingChanged?.(state.matches('loading'));
  }, [state.matches('loading')]);

  const diagnostics: Diagnostic[] = state.context.result;

  useEffect(() => {
    props.onDiagnosticsLoaded(props.isVisible ? diagnostics : []);
  }, [props.isVisible, diagnostics]);

  return (
    <Box
      display={'flex'}
      flexDirection={'column'}
      gap={diagnostics.length > 0 ? '8px' : '0px'}
      height={'100%'}
      width={'100%'}
    >
      <NullStateText
        visible={state.matches('waiting')}
        text={'Waiting for lyrics'}
      />

      <NullStateText
        visible={state.matches('no-results')}
        text={'No issues found'}
      />

      {diagnostics.length > 0 && (
        <DiagnosticsList
          diagnostics={diagnostics}
          onDiagnosticClicked={props.onDiagnosticClicked}
          onProposalAccepted={props.onProposalAccepted}
        />
      )}
    </Box>
  );
};

const DiagnosticsList = (props: {
  diagnostics: Diagnostic[];
  onDiagnosticClicked: (diagnostic: Diagnostic) => void;
  onProposalAccepted: (proposal: string, diagnostic: Diagnostic) => void;
}) => (
  <List>
    {props.diagnostics.map((diagnostic) => (
      <DiagnosticRow
        key={JSON.stringify(diagnostic)}
        diagnostic={diagnostic}
        onClick={() => props.onDiagnosticClicked(diagnostic)}
        onProposalClicked={(proposal) =>
          props.onProposalAccepted(proposal, diagnostic)
        }
      />
    ))}
  </List>
);

const DiagnosticRow = (props: {
  diagnostic: Diagnostic;
  onClick: () => void;
  onProposalClicked: (proposal: string) => void;
}) => {
  const theme = useTheme();
  return (
    <ListItem disablePadding onClick={props.onClick}>
      <ListItemButton
        divider
        sx={{
          ':hover': {
            backgroundColor: theme.palette.background.paper,
          },
        }}
      >
        <ListItemText
          sx={{
            paddingRight: '8px',
          }}
          primary={<Markdown text={props.diagnostic.message} />}
        />
        <ListItemSecondaryAction>
          <IconButton onClick={props.onClick}>
            <ChevronRight />
          </IconButton>
        </ListItemSecondaryAction>
      </ListItemButton>
    </ListItem>
  );
};

interface DiagnosticActionPopoverProps {
  diagnostic?: Diagnostic;
  domRect?: DOMRect;
  onClose: () => void;
  onProposalAccepted: (proposal: string, diagnostic: Diagnostic) => void;
}

export const DiagnosticActionPopover = (
  props: DiagnosticActionPopoverProps,
) => (
  <Popover
    open={props.diagnostic?.proposals?.length > 0}
    onClose={props.onClose}
    anchorEl={
      props.domRect && {
        getBoundingClientRect: () => props.domRect,
        nodeType: 1,
      }
    }
    anchorOrigin={{
      vertical: 'center',
      horizontal: 'center',
    }}
  >
    <Paper>
      <DiagnosticActionPopoverContent
        diagnostic={props.diagnostic}
        onProposalAccepted={props.onProposalAccepted}
      />
    </Paper>
  </Popover>
);

interface DiagnosticActionPopoverContentProps {
  diagnostic: Diagnostic;
  onProposalAccepted: (proposal: string, diagnostic: Diagnostic) => void;
}

const DiagnosticActionPopoverContent = (
  props: DiagnosticActionPopoverContentProps,
) => (
  <List dense>
    {(props.diagnostic?.proposals?.slice(0, 6) ?? []).map((proposal) => (
      <ListItem
        disablePadding
        dense
        onClick={() => {
          props.onProposalAccepted(proposal, props.diagnostic);
        }}
      >
        <ListItemButton dense>
          <ListItemText>{proposal}</ListItemText>
        </ListItemButton>
      </ListItem>
    ))}
  </List>
);
