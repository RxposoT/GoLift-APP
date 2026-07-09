import { useEffect, useState, useCallback } from "react";
import { View, FlatList, Pressable, ActivityIndicator, Alert, Modal, TextInput as RNInput } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../styles/theme";
import { useAndroidInsets } from "../../hooks/useAndroidInsets";
import { adminApi } from "../../services/api/admin";
import { Text } from "../../components/ui/Text";
import { spacing, radius } from "../../styles/tokens";

interface Phrase {
  id: number; data: string; frase: string; criado_em: string;
}

export default function AdminPhrases() {
  const theme = useTheme();
  const { safeTop } = useAndroidInsets();
  const [phrases, setPhrases] = useState<Phrase[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<Phrase | null>(null);
  const [formData, setFormData] = useState("");
  const [formFrase, setFormFrase] = useState("");
  const [saving, setSaving] = useState(false);
  const cardBg = theme.backgroundSecondary;

  useEffect(() => { loadPhrases(); }, []);

  async function loadPhrases() {
    try {
      setLoading(true);
      const data = await adminApi.getPhrases();
      setPhrases(data);
    } catch (err: any) {
      Alert.alert("Erro", err.message || "Erro ao carregar frases");
    } finally { setLoading(false); }
  }

  function openAdd() {
    setEditItem(null);
    setFormData(new Date().toISOString().split("T")[0]);
    setFormFrase("");
    setShowModal(true);
  }

  function openEdit(item: Phrase) {
    setEditItem(item);
    setFormData(item.data);
    setFormFrase(item.frase);
    setShowModal(true);
  }

  async function save() {
    if (!formData || !formFrase.trim()) {
      Alert.alert("Erro", "Data e frase são obrigatórios.");
      return;
    }
    try {
      setSaving(true);
      if (editItem) {
        await adminApi.updatePhrase(editItem.id, formFrase.trim());
      } else {
        await adminApi.createPhrase(formData, formFrase.trim());
      }
      setShowModal(false);
      await loadPhrases();
    } catch (err: any) {
      Alert.alert("Erro", err.message || "Erro ao guardar frase");
    } finally { setSaving(false); }
  }

  function confirmDelete(item: Phrase) {
    Alert.alert("Remover Frase", `Tens a certeza que queres remover esta frase?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Remover", style: "destructive",
        onPress: async () => {
          try {
            await adminApi.deletePhrase(item.id);
            setPhrases(prev => prev.filter(p => p.id !== item.id));
          } catch (err: any) {
            Alert.alert("Erro", err.message || "Erro ao remover frase");
          }
        },
      },
    ]);
  }

  const renderPhrase = useCallback(({ item }: { item: Phrase }) => (
    <View style={{ backgroundColor: cardBg, borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.sm }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs, marginBottom: spacing.xs }}>
            <Ionicons name="calendar-outline" size={14} color={theme.textSecondary} />
            <Text variant="caption" style={{ color: theme.textSecondary }}>{item.data}</Text>
          </View>
          <Text variant="body" style={{ color: theme.text }}>{item.frase}</Text>
        </View>
        <View style={{ flexDirection: "row", gap: spacing.xs, marginLeft: spacing.sm }}>
          <Pressable
            onPress={() => openEdit(item)}
            style={({ pressed }) => ({
              width: 36, height: 36, borderRadius: 18,
              backgroundColor: theme.accent + "15",
              justifyContent: "center", alignItems: "center",
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Ionicons name="pencil-outline" size={18} color={theme.accent} />
          </Pressable>
          <Pressable
            onPress={() => confirmDelete(item)}
            style={({ pressed }) => ({
              width: 36, height: 36, borderRadius: 18,
              backgroundColor: theme.danger + "15",
              justifyContent: "center", alignItems: "center",
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Ionicons name="trash-outline" size={18} color={theme.danger} />
          </Pressable>
        </View>
      </View>
    </View>
  ), [theme, cardBg]);

  return (
    <View style={{ flex: 1, backgroundColor: theme.background, paddingTop: safeTop }}>
      {/* Header */}
      <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: spacing.md, paddingVertical: spacing.md }}>
        <Pressable onPress={() => router.back()} style={{ marginRight: spacing.sm }}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </Pressable>
        <Text variant="title2" style={{ color: theme.text, fontWeight: "700", flex: 1 }}>
          Frases Diárias
        </Text>
        <Pressable onPress={openAdd} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: theme.accent, justifyContent: "center", alignItems: "center" }}>
          <Ionicons name="add" size={22} color="#fff" />
        </Pressable>
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={theme.accent} />
        </View>
      ) : (
        <FlatList
          data={phrases}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderPhrase}
          contentContainerStyle={{ paddingHorizontal: spacing.md, paddingBottom: spacing.xl }}
          ListEmptyComponent={
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingTop: 60 }}>
              <Ionicons name="chatbubble-outline" size={40} color={theme.textSecondary} />
              <Text variant="body" style={{ color: theme.textSecondary, marginTop: spacing.sm }}>Nenhuma frase encontrada</Text>
              <Pressable onPress={openAdd} style={{ marginTop: spacing.md }}>
                <Text variant="body" style={{ color: theme.accent }}>Criar primeira frase</Text>
              </Pressable>
            </View>
          }
        />
      )}

      {/* Add/Edit Modal */}
      <Modal visible={showModal} transparent animationType="fade" onRequestClose={() => setShowModal(false)}>
        <Pressable style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", padding: spacing.md }} onPress={() => setShowModal(false)}>
          <Pressable onPress={() => {}} style={{ backgroundColor: cardBg, borderRadius: radius.xl, padding: spacing.lg }}>
            <Text variant="title3" style={{ color: theme.text, fontWeight: "700", marginBottom: spacing.md }}>
              {editItem ? "Editar Frase" : "Nova Frase"}
            </Text>

            <Text variant="caption" style={{ color: theme.textSecondary, marginBottom: spacing.xs }}>Data</Text>
            <RNInput
              value={formData}
              onChangeText={setFormData}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={theme.textSecondary}
              style={{
                backgroundColor: theme.background, color: theme.text,
                borderRadius: radius.md, padding: spacing.sm, marginBottom: spacing.md,
                fontSize: 16,
              }}
            />

            <Text variant="caption" style={{ color: theme.textSecondary, marginBottom: spacing.xs }}>Frase</Text>
            <RNInput
              value={formFrase}
              onChangeText={setFormFrase}
              placeholder="Escreve a frase motivacional..."
              placeholderTextColor={theme.textSecondary}
              multiline
              numberOfLines={3}
              style={{
                backgroundColor: theme.background, color: theme.text,
                borderRadius: radius.md, padding: spacing.sm, marginBottom: spacing.lg,
                fontSize: 16, minHeight: 80, textAlignVertical: "top",
              }}
            />

            <View style={{ flexDirection: "row", gap: spacing.sm }}>
              <Pressable
                onPress={() => setShowModal(false)}
                style={{ flex: 1, paddingVertical: spacing.sm, borderRadius: radius.md, alignItems: "center", backgroundColor: theme.background }}
              >
                <Text variant="body" style={{ color: theme.textSecondary }}>Cancelar</Text>
              </Pressable>
              <Pressable
                onPress={save}
                disabled={saving}
                style={{ flex: 1, paddingVertical: spacing.sm, borderRadius: radius.md, alignItems: "center", backgroundColor: theme.accent }}
              >
                {saving ? <ActivityIndicator size="small" color="#fff" /> : <Text variant="body" style={{ color: "#fff", fontWeight: "600" }}>{editItem ? "Guardar" : "Criar"}</Text>}
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
