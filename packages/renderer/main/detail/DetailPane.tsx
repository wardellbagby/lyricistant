import {
  Dictionary,
  DictionaryProps,
} from '@lyricistant/renderer/dictionary/Dictionary';
import { Rhymes, RhymesProps } from '@lyricistant/renderer/rhymes/Rhymes';
import { Box, LinearProgress, Tab, Tabs } from '@mui/material';
import { BookAlphabet, ScriptOutline } from 'mdi-material-ui';
import React, { PropsWithChildren, useEffect, useState } from 'react';

interface DetailPaneProps {
  rhymeProps: Omit<RhymesProps, keyof DetailPaneChildProps>;
  dictionaryProps: Omit<DictionaryProps, keyof DetailPaneChildProps>;
}

export interface DetailPaneChildProps {
  isVisible?: boolean;
  onLoadingChanged?: (isLoading: boolean) => void;
}

type TabbedItemProps = PropsWithChildren<{
  index: number;
  selectedIndex: number;
}>;
const TabbedItem = ({ index, selectedIndex, children }: TabbedItemProps) => (
  <Box
    sx={{
      display: index === selectedIndex ? 'block' : 'none',
      flex: '1 1 auto',
      overflow: 'auto',
    }}
  >
    {children}
  </Box>
);

export const DetailPane: React.FC<DetailPaneProps> = (props) => {
  const [tabIndex, setTabIndex] = useState(0);
  const [isLoading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(false);
  }, [tabIndex]);

  return (
    <Box
      display={'flex'}
      flexDirection={'column'}
      height={'100%'}
      width={'100%'}
    >
      <Tabs
        value={tabIndex}
        onChange={(_, newTabIndex) => setTabIndex(newTabIndex)}
        variant={'fullWidth'}
        sx={{
          flex: '0 0 auto',
          boxShadow: 1,
        }}
        TabIndicatorProps={{
          children: isLoading ? (
            <LinearProgress variant={'indeterminate'} />
          ) : undefined,
        }}
      >
        <Tab aria-label={'Rhymes Tab'} icon={<ScriptOutline />} />
        <Tab aria-label={'Dictionary Tab'} icon={<BookAlphabet />} />
      </Tabs>
      <TabbedItem index={0} selectedIndex={tabIndex}>
        <Rhymes
          {...props.rhymeProps}
          isVisible={tabIndex === 0}
          onLoadingChanged={setLoading}
        />
      </TabbedItem>
      <TabbedItem index={1} selectedIndex={tabIndex}>
        <Dictionary
          {...props.dictionaryProps}
          isVisible={tabIndex === 1}
          onLoadingChanged={setLoading}
        />
      </TabbedItem>
    </Box>
  );
};
