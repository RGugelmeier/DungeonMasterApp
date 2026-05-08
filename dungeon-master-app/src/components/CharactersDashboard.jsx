import {
    Box,
    Button,
    createTreeCollection,
    Dialog,
    Flex,
    Heading,
    HStack,
    IconButton,
    Input,
    NativeSelect,
    SegmentGroup,
    SimpleGrid,
    Stack,
    Text,
    TreeView,
    VStack,
} from "@chakra-ui/react";
import { LuUser, LuUsers, LuPlus, LuSave, LuLink, LuTrash2, LuExternalLink } from "react-icons/lu";
import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../API/apiClient";

const STAT_FIELDS = ['strength', 'dexterity', 'constitution', 'wisdom', 'intelligence', 'charisma']
const STAT_LABELS = { strength: 'STR', dexterity: 'DEX', constitution: 'CON', wisdom: 'WIS', intelligence: 'INT', charisma: 'CHA' }

const EMPTY_CHAR = {
    character_name: '', owning_player: '',
    hp: 0, ac: 0,
    strength: 10, dexterity: 10, constitution: 10,
    wisdom: 10, intelligence: 10, charisma: 10,
    inventory: {}, abilities: {}, spells: {}
}

function StatBox({ label, value, editable, onChange }) {
    return (
        <VStack gap={0} border="1px solid" borderColor="gray.300" borderRadius="md" p={2} w="70px" bg="white">
            <Text fontSize="xs" fontWeight="bold" color="gray.500">{label}</Text>
            {editable
                ? <Input size="xs" textAlign="center" type="number" value={value}
                    onChange={e => onChange(parseInt(e.target.value) || 0)} p={0} border="none" />
                : <Text fontWeight="bold" fontSize="lg">{value}</Text>
            }
        </VStack>
    )
}

function CharacterSheet({ character, editable, onChange, linkedPages, onNavigateToPage, onAddLink, onRemoveLink, allPages }) {
    if (!character) return (
        <Flex w="100%" h="100%" align="center" justify="center">
            <Text color="gray.400">Select a character from the tree</Text>
        </Flex>
    )

    const set = (field) => (val) => onChange({ ...character, [field]: val })

    return (
        <VStack align="stretch" p={4} gap={4} overflowY="auto" h="100%">
            <HStack gap={4}>
                <VStack align="start" flex="1" gap={1}>
                    <Text fontSize="xs" color="gray.500">Character Name</Text>
                    {editable
                        ? <Input value={character.character_name} onChange={e => set('character_name')(e.target.value)} />
                        : <Heading size="md">{character.character_name}</Heading>
                    }
                </VStack>
                <VStack align="start" gap={1}>
                    <Text fontSize="xs" color="gray.500">Player</Text>
                    {editable
                        ? <Input value={character.owning_player} onChange={e => set('owning_player')(e.target.value)} />
                        : <Text>{character.owning_player || '—'}</Text>
                    }
                </VStack>
                <VStack align="start" gap={1}>
                    <Text fontSize="xs" color="gray.500">HP</Text>
                    {editable
                        ? <Input w="70px" type="number" value={character.hp} onChange={e => set('hp')(parseInt(e.target.value) || 0)} />
                        : <Text fontWeight="bold">{character.hp}</Text>
                    }
                </VStack>
                <VStack align="start" gap={1}>
                    <Text fontSize="xs" color="gray.500">AC</Text>
                    {editable
                        ? <Input w="70px" type="number" value={character.ac} onChange={e => set('ac')(parseInt(e.target.value) || 0)} />
                        : <Text fontWeight="bold">{character.ac}</Text>
                    }
                </VStack>
            </HStack>

            <Box>
                <Text fontWeight="semibold" mb={2}>Ability Scores</Text>
                <HStack gap={2} flexWrap="wrap">
                    {STAT_FIELDS.map(f => (
                        <StatBox key={f} label={STAT_LABELS[f]} value={character[f]}
                            editable={editable} onChange={set(f)} />
                    ))}
                </HStack>
            </Box>

            <SimpleGrid columns={3} gap={4}>
                {['inventory', 'abilities', 'spells'].map(field => (
                    <Box key={field}>
                        <Text fontWeight="semibold" mb={1} textTransform="capitalize">{field}</Text>
                        {editable
                            ? <Input
                                as="textarea"
                                value={typeof character[field] === 'object'
                                    ? JSON.stringify(character[field], null, 2) : character[field]}
                                onChange={e => {
                                    try { set(field)(JSON.parse(e.target.value)) }
                                    catch { set(field)(e.target.value) }
                                }}
                                minH="80px"
                                fontFamily="mono"
                                fontSize="xs"
                            />
                            : <Box bg="white" borderRadius="md" p={2} minH="80px" fontSize="sm" border="1px solid" borderColor="gray.200">
                                {typeof character[field] === 'object' && Object.keys(character[field]).length === 0
                                    ? <Text color="gray.400">None</Text>
                                    : <pre style={{whiteSpace: 'pre-wrap', fontSize: '12px'}}>
                                        {JSON.stringify(character[field], null, 2)}
                                      </pre>
                                }
                              </Box>
                        }
                    </Box>
                ))}
            </SimpleGrid>

            <Box>
                <HStack mb={2} justify="space-between">
                    <Text fontWeight="semibold">Linked Pages</Text>
                    <NativeSelect.Root maxW="200px" size="sm">
                        <NativeSelect.Field
                            value=""
                            onChange={e => { if (e.target.value) onAddLink(parseInt(e.target.value)) }}
                        >
                            <option value="">+ Link a page...</option>
                            {allPages
                                .filter(p => !linkedPages.some(l => l.page_id === p.id))
                                .map(p => (
                                    <option key={p.id} value={p.id}>{p.notebookName} › {p.chapterName} › {p.name}</option>
                                ))
                            }
                        </NativeSelect.Field>
                        <NativeSelect.Indicator />
                    </NativeSelect.Root>
                </HStack>
                {linkedPages.length === 0 ? (
                    <Text fontSize="sm" color="gray.400">No pages linked yet.</Text>
                ) : (
                    <VStack alignItems="stretch" gap={1}>
                        {linkedPages.map(link => (
                            <HStack key={link.link_id} px={2} py={1} borderRadius="md" border="1px solid" borderColor="gray.200" bg="white">
                                <LuLink size={12} />
                                <VStack gap={0} alignItems="flex-start" flex="1" minW={0}>
                                    <Text fontSize="sm" fontWeight="medium" overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap">{link.page_name}</Text>
                                    <Text fontSize="xs" color="gray.400" overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap">{link.notebook_name} › {link.chapter_name}</Text>
                                </VStack>
                                <IconButton size="xs" variant="ghost" aria-label="Go to page" onClick={() => onNavigateToPage(link.page_id)}>
                                    <LuExternalLink />
                                </IconButton>
                                <IconButton size="xs" variant="ghost" colorPalette="red" aria-label="Remove link" onClick={() => onRemoveLink(link.link_id)}>
                                    <LuTrash2 />
                                </IconButton>
                            </HStack>
                        ))}
                    </VStack>
                )}
            </Box>
        </VStack>
    )
}

function CharactersDashboard({ campaignId, onNavigateToPage }) {
    const [pcs, setPcs] = useState([])
    const [npcs, setNpcs] = useState([])
    const [selectedChar, setSelectedChar] = useState(null)
    const [selectedType, setSelectedType] = useState(null)
    const [editMode, setEditMode] = useState(false)
    const [editBuffer, setEditBuffer] = useState(null)
    const [addType, setAddType] = useState(null)
    const [linkedPages, setLinkedPages] = useState([])
    const [allPages, setAllPages] = useState([])
    const [newCharData, setNewCharData] = useState({
        character_name: '', owning_player: '',
        hp: 0, ac: 0,
        strength: 10, dexterity: 10, constitution: 10,
        wisdom: 10, intelligence: 10, charisma: 10,
    })

    const setNewField = (field) => (val) => setNewCharData(prev => ({ ...prev, [field]: val }))

    const loadCharacters = async () => {
        try {
            const response = await apiFetch("/characters/get_characters", {
                method: "POST",
                data: { campaign_id: campaignId }
            })
            setPcs(response.data.player_characters)
            setNpcs(response.data.non_player_characters)
        } catch (e) {
            console.error("Failed to load characters:", e)
        }
    }

    useEffect(() => { loadCharacters() }, [campaignId])

    const loadAllPages = async () => {
        try {
            const response = await apiFetch("/notes/get_campaign_notes", { method: "POST", data: { active_campaign: campaignId } })
            const data = response.data
            if (!Array.isArray(data)) return
            const pages = []
            data.forEach(entry => {
                if (entry.chapter_id) {
                    entry.pages.forEach(p => pages.push({
                        id: p.page_id,
                        name: p.page_name,
                        chapterName: entry.chapter,
                        notebookName: entry.notebook,
                        chapterId: entry.chapter_id
                    }))
                }
            })
            setAllPages(pages)
        } catch (e) {
            console.error("Failed to load pages for linking:", e)
        }
    }

    const treeData = useMemo(() => ({
        value: 'root', label: 'Root',
        children: [
            {
                value: 'pcs', label: 'Player Characters',
                children: pcs.map(c => ({ value: `pc-${c.character_id}`, label: c.character_name }))
            },
            {
                value: 'npcs', label: 'Non-Player Characters',
                children: npcs.map(c => ({ value: `npc-${c.character_id}`, label: c.character_name }))
            }
        ]
    }), [pcs, npcs])

    const tree = createTreeCollection({ rootNode: treeData })

    const handleSelectChar = (nodeValue) => {
        if (nodeValue === 'pcs' || nodeValue === 'npcs') return
        const [type, idStr] = nodeValue.split('-')
        const id = parseInt(idStr)
        const list = type === 'pc' ? pcs : npcs
        const char = list.find(c => c.character_id === id)
        if (char) {
            setSelectedChar(char)
            setSelectedType(type)
            setEditBuffer({ ...char })
            setEditMode(false)
            loadLinkedPages(id, type)
            if (allPages.length === 0) loadAllPages()
        }
    }

    const loadLinkedPages = async (charId, charType) => {
        try {
            const response = await apiFetch("/characters/get_links", {
                method: "POST",
                data: { character_id: charId, character_type: charType }
            })
            setLinkedPages(response.data)
        } catch (e) {
            console.error("Failed to load links:", e)
        }
    }

    const handleAddLink = async (pageId) => {
        if (!selectedChar || !selectedType) return
        try {
            const response = await apiFetch("/characters/add_link", {
                method: "POST",
                data: { character_id: selectedChar.character_id, character_type: selectedType, page_id: pageId }
            })
            setLinkedPages(prev => [...prev, response.data])
        } catch (e) {
            console.error("Failed to add link:", e)
        }
    }

    const handleRemoveLink = async (linkId) => {
        try {
            await apiFetch("/characters/delete_link", { method: "DELETE", data: { link_id: linkId } })
            setLinkedPages(prev => prev.filter(l => l.link_id !== linkId))
        } catch (e) {
            console.error("Failed to remove link:", e)
        }
    }

    const handleSave = async () => {
        if (!editBuffer || !selectedType) return
        try {
            const response = await apiFetch("/characters/update_character", {
                method: "POST",
                data: { ...editBuffer, type: selectedType }
            })
            const updated = response.data
            if (selectedType === 'pc') {
                setPcs(prev => prev.map(c => c.character_id === updated.character_id ? updated : c))
            } else {
                setNpcs(prev => prev.map(c => c.character_id === updated.character_id ? updated : c))
            }
            setSelectedChar(updated)
            setEditBuffer({ ...updated })
            setEditMode(false)
        } catch (e) {
            console.error("Failed to save character:", e)
        }
    }

    const handleAddCharacter = async () => {
        if (!newCharData.character_name.trim()) return
        try {
            const response = await apiFetch("/characters/add_character", {
                method: "POST",
                data: { ...newCharData, campaign_id: campaignId, type: addType }
            })
            const newChar = response.data
            if (addType === 'pc') setPcs(prev => [...prev, newChar])
            else setNpcs(prev => [...prev, newChar])
            setAddType(null)
        } catch (e) {
            console.error("Failed to add character:", e)
        }
    }

    return (
        <HStack w="100%" h="100%" alignItems="stretch" overflow="hidden">
            <VStack w="20%" h="100%" alignItems="stretch" gap={0}>
                <HStack px={2} py={1} justify="space-between">
                    <Text fontWeight="bold" fontSize="sm">Characters</Text>
                </HStack>
                <TreeView.Root collection={tree} flex="1" overflowY="auto">
                    <TreeView.Tree>
                        <TreeView.Node
                            indentGuide={<TreeView.BranchIndentGuide />}
                            render={({ node, nodeState }) =>
                            (node.value === 'pcs' || node.value === 'npcs') ? (
                                <TreeView.BranchControl>
                                    <LuUsers />
                                    <TreeView.BranchText>{node.label}</TreeView.BranchText>
                                    <IconButton size="xs" variant="ghost" ml="auto"
                                        aria-label="Add character"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            setAddType(node.value === 'pcs' ? 'pc' : 'npc')
                                            setNewCharData({
                                                character_name: '', owning_player: '',
                                                hp: 0, ac: 0,
                                                strength: 10, dexterity: 10, constitution: 10,
                                                wisdom: 10, intelligence: 10, charisma: 10,
                                            })
                                        }}>
                                        <LuPlus />
                                    </IconButton>
                                </TreeView.BranchControl>
                            ) : (
                                <TreeView.Item onClick={() => handleSelectChar(node.value)}>
                                    <LuUser />
                                    <TreeView.ItemText>{node.label}</TreeView.ItemText>
                                </TreeView.Item>
                            )}
                        />
                    </TreeView.Tree>
                </TreeView.Root>
            </VStack>

            <Flex direction="column" flex="1" h="100%" overflow="hidden">
                <HStack px={3} py={2} borderBottomWidth="1px" justify="space-between" flexShrink={0}>
                    <SegmentGroup.Root
                        value={editMode ? "edit" : "view"}
                        onValueChange={(e) => setEditMode(e.value === "edit")}
                        size="sm" width="120px"
                        disabled={!selectedChar}
                    >
                        <SegmentGroup.Indicator />
                        <SegmentGroup.Item value="view">
                            <SegmentGroup.ItemText>View</SegmentGroup.ItemText>
                            <SegmentGroup.ItemHiddenInput />
                        </SegmentGroup.Item>
                        <SegmentGroup.Item value="edit">
                            <SegmentGroup.ItemText>Edit</SegmentGroup.ItemText>
                            <SegmentGroup.ItemHiddenInput />
                        </SegmentGroup.Item>
                    </SegmentGroup.Root>
                    <Button size="sm" variant="ghost" disabled={!editMode || !editBuffer} onClick={handleSave}>
                        <LuSave /> Save
                    </Button>
                </HStack>
                <Box flex="1" overflow="hidden" bg="white">
                    <CharacterSheet
                        character={editMode ? editBuffer : selectedChar}
                        editable={editMode}
                        onChange={setEditBuffer}
                        linkedPages={linkedPages}
                        allPages={allPages}
                        onNavigateToPage={onNavigateToPage}
                        onAddLink={handleAddLink}
                        onRemoveLink={handleRemoveLink}
                    />
                </Box>
            </Flex>

            <Dialog.Root open={addType !== null} onOpenChange={(e) => { if (!e.open) setAddType(null) }}>
                <Dialog.Backdrop />
                <Dialog.Positioner>
                    <Dialog.Content>
                        <Dialog.Header>
                            <Dialog.Title>
                                Add {addType === 'pc' ? 'Player Character' : 'NPC'}
                            </Dialog.Title>
                        </Dialog.Header>
                        <Dialog.Body>
                            <Stack gap={3}>
                                <Input
                                    placeholder="Character name"
                                    value={newCharData.character_name}
                                    onChange={e => setNewField('character_name')(e.target.value)}
                                    autoFocus
                                />
                                <Input
                                    placeholder="Player name (optional)"
                                    value={newCharData.owning_player}
                                    onChange={e => setNewField('owning_player')(e.target.value)}
                                />
                                <HStack gap={4}>
                                    <VStack align="start" gap={1} flex="1">
                                        <Text fontSize="xs" color="gray.500">HP</Text>
                                        <Input type="number" value={newCharData.hp}
                                            onChange={e => setNewField('hp')(parseInt(e.target.value) || 0)} />
                                    </VStack>
                                    <VStack align="start" gap={1} flex="1">
                                        <Text fontSize="xs" color="gray.500">AC</Text>
                                        <Input type="number" value={newCharData.ac}
                                            onChange={e => setNewField('ac')(parseInt(e.target.value) || 0)} />
                                    </VStack>
                                </HStack>
                                <Text fontSize="sm" fontWeight="semibold" mt={1}>Ability Scores</Text>
                                <HStack gap={2} flexWrap="wrap">
                                    {STAT_FIELDS.map(f => (
                                        <VStack key={f} gap={0} align="center" w="70px">
                                            <Text fontSize="xs" color="gray.500">{STAT_LABELS[f]}</Text>
                                            <Input
                                                size="sm" textAlign="center" type="number"
                                                value={newCharData[f]}
                                                onChange={e => setNewField(f)(parseInt(e.target.value) || 0)}
                                            />
                                        </VStack>
                                    ))}
                                </HStack>
                            </Stack>
                        </Dialog.Body>
                        <Dialog.Footer>
                            <Button variant="outline" onClick={() => setAddType(null)}>Cancel</Button>
                            <Button
                                onClick={handleAddCharacter}
                                disabled={!newCharData.character_name.trim()}
                            >Create</Button>
                        </Dialog.Footer>
                        <Dialog.CloseTrigger />
                    </Dialog.Content>
                </Dialog.Positioner>
            </Dialog.Root>
        </HStack>
    )
}

export default CharactersDashboard
