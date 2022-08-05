import {
  Dictionary,
  DictionaryProps,
} from '@lyricistant/renderer/dictionary/Dictionary';
import { Rhymes, RhymesProps } from '@lyricistant/renderer/rhymes/Rhymes';
import { Box, Tab, Tabs } from '@mui/material';
import { BookAlphabet, ScriptOutline } from 'mdi-material-ui';
import React, { PropsWithChildren, useState } from 'react';
import SwipeableViews from 'react-swipeable-views';

const Panel = ({
  currentTabIndex,
  index,
  children,
}: PropsWithChildren<{
  currentTabIndex: number;
  index: number;
}>) => (
  <Box
    display={currentTabIndex !== index ? 'none' : undefined}
    minHeight={0}
    height={'100%'}
    width={'100%'}
  >
    {children}
  </Box>
);
interface DetailPaneProps {
  rhymeProps: Omit<RhymesProps, keyof DetailPaneQueryableChildProps>;
  dictionaryProps: Omit<DictionaryProps, keyof DetailPaneQueryableChildProps>;
}

interface DetailPaneQueryableChildProps {
  loadOnQueryChange: boolean;
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
      <SwipeableViews
        index={tabIndex}
        onChangeIndex={setTabIndex}
        style={{ flex: '1 1 auto' }}
        containerStyle={{ height: '100%', width: '100%' }}
      >
        <Panel currentTabIndex={tabIndex} index={0}>
          <Rhymes {...props.rhymeProps} loadOnQueryChange={tabIndex === 0} />
        </Panel>
        <Panel currentTabIndex={tabIndex} index={1}>
          <Dictionary
            {...props.dictionaryProps}
            loadOnQueryChange={tabIndex === 1}
          />
        </Panel>
      </SwipeableViews>
    </Box>
  );
};
