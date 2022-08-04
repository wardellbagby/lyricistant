import {
  Dictionary,
  DictionaryProps,
} from '@lyricistant/renderer/dictionary/Dictionary';
import { Rhymes, RhymesProps } from '@lyricistant/renderer/rhymes/Rhymes';
import { Box, Tab, Tabs } from '@mui/material';
import { BookSearch, ScriptOutline } from 'mdi-material-ui';
import React, { useState } from 'react';

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
        <Tab icon={<BookSearch />} />
      </Tabs>
      <Box display={tabIndex !== 0 ? 'none' : undefined} minHeight={0}>
        <Rhymes {...props.rhymeProps} />
      </Box>
      <Box display={tabIndex !== 1 ? 'none' : undefined} minHeight={0}>
        <Dictionary {...props.dictionaryProps} />
      </Box>
    </Box>
  );
};
