import React from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
  Dimensions,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Spacing } from '@/constants/theme';

type Props = {
  list: string[];
  index: number;
  onClose: () => void;
  onNav: (i: number) => void;
};

export function PhotoViewer({ list, index, onClose, onNav }: Props) {
  const current = list[index];
  if (!current) return null;

  const hasMultiple = list.length > 1;

  return (
    <Modal visible animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <TouchableOpacity style={styles.closeButton} onPress={onClose} hitSlop={12}>
          <Feather name="x" size={24} color="#fff" />
        </TouchableOpacity>

        {hasMultiple && (
          <>
            <TouchableOpacity
              style={[styles.navButton, styles.prevButton]}
              onPress={() => onNav((index - 1 + list.length) % list.length)}
              hitSlop={12}
            >
              <Feather name="chevron-left" size={28} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.navButton, styles.nextButton]}
              onPress={() => onNav((index + 1) % list.length)}
              hitSlop={12}
            >
              <Feather name="chevron-right" size={28} color="#fff" />
            </TouchableOpacity>
          </>
        )}

        <View style={styles.imageContainer}>
          <Image source={{ uri: current }} style={styles.image} resizeMode="contain" />
        </View>

        {hasMultiple && (
          <Text style={styles.counter}>
            {index + 1} / {list.length}
          </Text>
        )}
      </View>
    </Modal>
  );
}

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.94)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  navButton: {
    position: 'absolute',
    zIndex: 10,
    top: '50%',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  prevButton: {
    left: 16,
  },
  nextButton: {
    right: 16,
  },
  imageContainer: {
    width: width * 0.95,
    height: height * 0.75,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  counter: {
    position: 'absolute',
    bottom: 40,
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
  },
});
