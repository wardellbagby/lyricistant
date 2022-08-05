import {
  Dictionary,
  DictionaryProps,
} from '@lyricistant/renderer/dictionary/Dictionary';
import { Rhymes, RhymesProps } from '@lyricistant/renderer/rhymes/Rhymes';
import { Box, Tab, Tabs } from '@mui/material';
import { BookAlphabet, ScriptOutline } from 'mdi-material-ui';
import React, { PropsWithChildren, useState } from 'react';

const Panel = ({
  currentTabIndex,
  index,
  children,
}: PropsWithChildren<{
  currentTabIndex: number;
  index: number;
}>) => (
  <Box display={currentTabIndex !== index ? 'none' : undefined} minHeight={0}>
    {children}
  </Box>
);
interface DetailPaneProps {
  rhymeProps: RhymesProps;
  dictionaryProps: DictionaryProps;
}

export const DetailPane: React.FC<DetailPaneProps> = (props) => {
  const [tabIndex, setTabIndex] = useState(0);

  return (
    <Box
      display={'flex'}
      flexDirection={'column'}
      height={'100%'}
      width={'100%'}
      gap={'8px'}
    >
      <Tabs
        value={tabIndex}
        onChange={(_, newTabIndex) => setTabIndex(newTabIndex)}
        variant={'fullWidth'}
        sx={{ flex: '0 0 auto' }}
      >
        <Tab icon={<ScriptOutline />} />
        <Tab icon={<BookAlphabet />} />
      </Tabs>
      <Panel currentTabIndex={tabIndex} index={0}>
        <Rhymes {...props.rhymeProps} />
      </Panel>
      <Panel currentTabIndex={tabIndex} index={1}>
        <Dictionary {...props.dictionaryProps} />
      </Panel>
    </Box>
  );
};
