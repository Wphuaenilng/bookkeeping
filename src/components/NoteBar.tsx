import { ComponentRef, useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useTheme } from '../theme/colors';
import { topNotes } from '../db/transactionsRepo';

/**
 * 行内备注输入:不用弹框,系统键盘把输入条顶上去。
 * 顶部展示高频备注(按历史使用次数),点一下直接带入。
 */
export function NoteBar({ value, onDone }: { value: string; onDone: (note: string) => void }) {
  const p = useTheme();
  const inputRef = useRef<ComponentRef<typeof TextInput>>(null);
  const [draft, setDraft] = useState(value);
  const suggestions = topNotes(6);

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 150);
    return () => clearTimeout(t);
  }, []);

  return (
    <View>
      {suggestions.length > 0 ? (
        <ScrollView
          horizontal
          keyboardShouldPersistTaps="handled"
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingHorizontal: 12, paddingTop: 8 }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, height: 26, borderRadius: 13, backgroundColor: p.bg }}>
            <MaterialCommunityIcons name="history" size={13} color={p.textSub} />
            <Text style={{ color: p.textSub, fontSize: 12 }}>高频</Text>
          </View>
          {suggestions.map((n) => (
            <Pressable
              key={n}
              onPress={() => setDraft(n)}
              style={{ paddingHorizontal: 10, height: 26, borderRadius: 13, backgroundColor: p.primaryMist, justifyContent: 'center' }}
              android_ripple={{ color: p.border }}
            >
              <Text style={{ color: p.primary, fontSize: 12 }} numberOfLines={1}>
                {n}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      ) : null}

      <View style={styles.inputRow}>
        <TextInput
          ref={inputRef}
          style={[styles.input, { color: p.text, backgroundColor: 'rgba(255,255,255,0.6)', borderColor: p.primarySoft }]}
          value={draft}
          placeholder="备注…(可留空)"
          placeholderTextColor={p.textSub}
          maxLength={50}
          returnKeyType="done"
          onSubmitEditing={() => onDone(draft.trim())}
          onChangeText={setDraft}
        />
        {draft ? (
          <Pressable hitSlop={8} onPress={() => setDraft('')}>
            <MaterialCommunityIcons name="close-circle-outline" size={20} color={p.textSub} />
          </Pressable>
        ) : null}
        <Pressable hitSlop={8} onPress={() => onDone(draft.trim())}>
          <Text style={{ color: p.primary, fontSize: 15, fontWeight: '700' }}>完成</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  input: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
});

export default NoteBar;
