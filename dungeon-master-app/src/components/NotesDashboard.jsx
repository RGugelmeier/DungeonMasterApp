import { 
    Box,
    Button,
    createTreeCollection,
    Dialog,
    HStack,
    IconButton,
    Input,
    NativeSelect,
    SegmentGroup,
    Stack,
    Text,
    TreeView,
    VStack,
}
from "@chakra-ui/react";
import { LuFile, LuFolder, LuPlus, LuSave, LuTag, LuTrash2 } from "react-icons/lu";
import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../API/apiClient";
import { Control, RichTextEditor } from "@/components/ui/rich-text-editor"
import StarterKit from "@tiptap/starter-kit";
import { useEditor } from "@tiptap/react"

function ModePicker({ currentMode, onModeChange, width }) {
    return (
        <SegmentGroup.Root
            value={currentMode}
            onValueChange={(e) => onModeChange(e.value)}
            size="sm"
            width={width}
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
    )
}

function NotesDashboard({ campaignId, pageNavTarget, onPageNavConsumed }) {
    const [notebooks, setNotebooks] = useState([])  // [{ id, name }]
    const [chapters, setChapters] = useState([])    // [{ id, name, category, notebookId }]
    const [pages, setPages] = useState([])          // [{ id, name, content, chapterId }]
    const [selectedPage, setSelectedPage] = useState(null)
    const [editable, setEditable] = useState(false)
    const [dialogType, setDialogType] = useState(null) // 'notebook' | 'chapter' | 'page'
    const [newItemName, setNewItemName] = useState('')
    const [newChapterCategory, setNewChapterCategory] = useState('other')
    const [newItemParentId, setNewItemParentId] = useState(null)
    const [confirmDelete, setConfirmDelete] = useState(null) // { type: 'notebook'|'chapter'|'page', id, label }
    const [draggedPageId, setDraggedPageId] = useState(null)
    const [dragOverPageId, setDragOverPageId] = useState(null)
    const [editingNode, setEditingNode] = useState(null)
    const [editingName, setEditingName] = useState('')
    const [isDirty, setIsDirty] = useState(false)
    const [leftTab, setLeftTab] = useState('notes')
    const [tags, setTags] = useState([])
    const [newTagName, setNewTagName] = useState('')
    const [tagResults, setTagResults] = useState({})
    const [expandedTagId, setExpandedTagId] = useState(null)

    const loadNotes = async () => {
        try {
            const response = await apiFetch("/notes/get_campaign_notes", {
                method: "POST",
                data: { active_campaign: campaignId }
            })
            const data = response.data
            if (!Array.isArray(data)) return
            const notebookMap = {}
            const chapterMap = {}
            data.forEach(entry => {
                if (!notebookMap[entry.notebook_id]) {
                    notebookMap[entry.notebook_id] = entry.notebook
                }
                if (entry.chapter_id && !chapterMap[entry.chapter_id]) {
                    chapterMap[entry.chapter_id] = {
                        id: entry.chapter_id,
                        name: entry.chapter,
                        category: entry.chapter_category,
                        notebookId: entry.notebook_id
                    }
                }
            })
            setNotebooks(Object.entries(notebookMap).map(([id, name]) => ({ id: parseInt(id), name })))
            setChapters(Object.values(chapterMap))
            setPages(data.flatMap(entry =>
                entry.chapter_id ? entry.pages.map(page => ({
                    id: page.page_id,
                    name: page.page_name,
                    content: page.page_content,
                    chapterId: entry.chapter_id
                })) : []
            ))
        } catch (error) {
            console.error("Failed to load notes:", error)
        }
    }

    const loadTags = async () => {
        try {
            const response = await apiFetch("/notes/get_tags", {
                method: "POST",
                data: { campaign_id: campaignId }
            })
            setTags(response.data.map(t => ({ id: t.tag_id, name: t.tag })))
        } catch (error) {
            console.error("Failed to load tags:", error)
        }
    }

    useEffect(() => {
        loadNotes()
        loadTags()
    }, [campaignId])

    useEffect(() => {
        if (!pageNavTarget) return
        if (isDirty && !window.confirm('You have unsaved changes. Discard them?')) {
            if (onPageNavConsumed) onPageNavConsumed()
            return
        }
        setIsDirty(false)
        setSelectedPage(String(pageNavTarget.pageId))
        if (onPageNavConsumed) onPageNavConsumed()
    }, [pageNavTarget])

    const handleSave = async () => {
        if (!selectedPage || !editor) return
        await apiFetch("/notes/save_page", {
            method: "POST",
            data: { page_id: parseInt(selectedPage), content: editor.getHTML() }
        })
        setPages(prev => prev.map(p =>
            String(p.id) === selectedPage ? { ...p, content: editor.getHTML() } : p
        ))
        setIsDirty(false)
    }

    const handleAddNotebook = async () => {
        const response = await apiFetch("/notes/add_notebook", {
            method: "POST",
            data: { campaign_id: campaignId, name: newItemName }
        })
        setNotebooks(prev => [...prev, { id: response.data.notebook_id, name: newItemName }])
        setDialogType(null)
        setNewItemName('')
    }

    const handleAddChapter = async () => {
        const response = await apiFetch("/notes/add_chapter", {
            method: "POST",
            data: { notebook_id: newItemParentId, name: newItemName, category: newChapterCategory }
        })
        setChapters(prev => [...prev, {
            id: response.data.chapter_id,
            name: newItemName,
            category: newChapterCategory,
            notebookId: newItemParentId
        }])
        setDialogType(null)
        setNewItemName('')
        setNewChapterCategory('other')
    }

    const handleAddPage = async () => {
        const response = await apiFetch("/notes/add_page", {
            method: "POST",
            data: { chapter_id: newItemParentId, name: newItemName }
        })
        setPages(prev => [...prev, {
            id: response.data.page_id,
            name: newItemName,
            content: '',
            chapterId: newItemParentId
        }])
        setDialogType(null)
        setNewItemName('')
    }

    const handleDeleteNotebook = async (notebookId) => {
        try {
            await apiFetch("/notes/delete_notebook", { method: "DELETE", data: { notebook_id: notebookId } })
            const removedChapterIds = chapters.filter(ch => ch.notebookId === notebookId).map(ch => ch.id)
            setNotebooks(prev => prev.filter(n => n.id !== notebookId))
            setChapters(prev => prev.filter(ch => ch.notebookId !== notebookId))
            setPages(prev => prev.filter(p => !removedChapterIds.includes(p.chapterId)))
            if (selectedPage && removedChapterIds.includes(pages.find(p => String(p.id) === selectedPage)?.chapterId)) {
                setSelectedPage(null)
                editor?.commands.setContent('')
            }
            setConfirmDelete(null)
        } catch (e) {
            console.error("Failed to delete notebook:", e)
        }
    }

    const handleDeleteChapter = async (chapterId) => {
        try {
            await apiFetch("/notes/delete_chapter", { method: "DELETE", data: { chapter_id: chapterId } })
            const removedPageIds = pages.filter(p => p.chapterId === chapterId).map(p => p.id)
            setChapters(prev => prev.filter(ch => ch.id !== chapterId))
            setPages(prev => prev.filter(p => p.chapterId !== chapterId))
            if (removedPageIds.includes(parseInt(selectedPage))) {
                setSelectedPage(null)
                editor?.commands.setContent('')
            }
            setConfirmDelete(null)
        } catch (e) {
            console.error("Failed to delete chapter:", e)
        }
    }

    const handleDeletePage = async (pageId) => {
        try {
            await apiFetch("/notes/delete_page", { method: "DELETE", data: { page_id: pageId } })
            setPages(prev => prev.filter(p => p.id !== pageId))
            if (selectedPage === String(pageId)) {
                setSelectedPage(null)
                editor?.commands.setContent('')
            }
            setConfirmDelete(null)
        } catch (e) {
            console.error("Failed to delete page:", e)
        }
    }

    const handleRename = async (nodeValue, newName) => {
        const trimmed = newName.trim()
        setEditingNode(null)
        if (!trimmed) return
        const id = parseInt(nodeValue.split('-')[1])
        try {
            if (nodeValue.startsWith('nb-')) {
                await apiFetch('/notes/rename_notebook', { method: 'POST', data: { notebook_id: id, name: trimmed } })
                setNotebooks(prev => prev.map(n => n.id === id ? { ...n, name: trimmed } : n))
            } else if (nodeValue.startsWith('ch-')) {
                await apiFetch('/notes/rename_chapter', { method: 'POST', data: { chapter_id: id, name: trimmed } })
                setChapters(prev => prev.map(ch => ch.id === id ? { ...ch, name: trimmed } : ch))
            } else if (nodeValue.startsWith('pg-')) {
                await apiFetch('/notes/rename_page', { method: 'POST', data: { page_id: id, name: trimmed } })
                setPages(prev => prev.map(p => p.id === id ? { ...p, name: trimmed } : p))
            }
        } catch (e) {
            console.error('Failed to rename:', e)
        }
    }

    const handleConfirmDelete = () => {
        if (!confirmDelete) return
        if (confirmDelete.type === 'notebook') handleDeleteNotebook(confirmDelete.id)
        else if (confirmDelete.type === 'chapter') handleDeleteChapter(confirmDelete.id)
        else if (confirmDelete.type === 'page') handleDeletePage(confirmDelete.id)
    }

    const handleDialogSubmit = () => {
        if (!newItemName.trim()) return
        if (dialogType === 'notebook') handleAddNotebook()
        else if (dialogType === 'chapter') handleAddChapter()
        else if (dialogType === 'page') handleAddPage()
    }

    const handleAddTag = async () => {
        const trimmed = newTagName.trim()
        if (!trimmed) return
        try {
            const response = await apiFetch('/notes/add_tag', {
                method: 'POST',
                data: { campaign_id: campaignId, name: trimmed }
            })
            setTags(prev => [...prev, { id: response.data.tag_id, name: trimmed }])
            setNewTagName('')
        } catch (e) {
            console.error('Failed to add tag:', e)
        }
    }

    const handleDeleteTag = async (tagId) => {
        try {
            await apiFetch('/notes/delete_tag', { method: 'DELETE', data: { tag_id: tagId } })
            setTags(prev => prev.filter(t => t.id !== tagId))
            setTagResults(prev => { const n = { ...prev }; delete n[tagId]; return n })
            if (expandedTagId === tagId) setExpandedTagId(null)
        } catch (e) {
            console.error('Failed to delete tag:', e)
        }
    }

    const handleExpandTag = async (tagId) => {
        if (expandedTagId === tagId) { setExpandedTagId(null); return }
        setExpandedTagId(tagId)
        try {
            const response = await apiFetch('/notes/search_tag', {
                method: 'POST',
                data: { tag_id: tagId }
            })
            setTagResults(prev => ({ ...prev, [tagId]: response.data }))
        } catch (e) {
            console.error('Failed to search tag:', e)
        }
    }

    const treeData = useMemo(() => ({
        value: 'root',
        label: 'Root',
        children: notebooks.map(notebook => {
            const notebookChapters = chapters.filter(ch => ch.notebookId === notebook.id)
            return {
                value: `nb-${notebook.id}`,
                label: notebook.name,
                children: notebookChapters.length > 0
                    ? notebookChapters.map(chapter => {
                        const chapterPages = pages.filter(p => p.chapterId === chapter.id)
                        return {
                            value: `ch-${chapter.id}`,
                            label: chapter.name,
                            children: chapterPages.length > 0
                                ? chapterPages.map(page => ({ value: `pg-${page.id}`, label: page.name }))
                                : [{ value: `empty-ch-${chapter.id}`, label: '' }]
                        }
                    })
                    : [{ value: `empty-nb-${notebook.id}`, label: '' }]
            }
        })
    }), [notebooks, chapters, pages])

    const tree = createTreeCollection({ rootNode: treeData })
    const extensions = useMemo(() => [StarterKit], [])
    const editor = useEditor({
        extensions,
        content: "",
    })

    useEffect(() => {
        if (!editor) return
        editor.setEditable(editable)
    }, [editor, editable])

    useEffect(() => {
        if (!editor) return
        const handleUpdate = () => { if (editable) setIsDirty(true) }
        editor.on('update', handleUpdate)
        return () => editor.off('update', handleUpdate)
    }, [editor, editable])

    const handleModeChange = (newMode) => {
        setEditable(newMode === "edit")
        editor.setEditable(newMode === "edit")
        if (newMode === 'view') setIsDirty(false)
    }

    const guardUnsaved = (action) => {
        if (isDirty && !window.confirm('You have unsaved changes. Discard them?')) return
        setIsDirty(false)
        action()
    }

    useEffect(() => {
        if (!editor || !selectedPage) return
        const page = pages.find(p => String(p.id) === selectedPage)
        if (page) {
            editor.commands.setContent(page.content)
            setIsDirty(false)
        }
    }, [selectedPage, editor])

    const dialogTitle = dialogType === 'notebook' ? 'New Notebook'
        : dialogType === 'chapter' ? 'New Chapter'
        : 'New Page'

    return (
        <Box w="100%" h="100%" overflow="hidden">
            <HStack h="100%" alignItems="stretch">
                <VStack w="20%" h="100%" alignItems="stretch" gap={0}>
                    <Box px={2} py={1} borderBottomWidth="1px" borderColor="gray.200">
                        <SegmentGroup.Root value={leftTab} onValueChange={e => setLeftTab(e.value)} size="sm" width="100%">
                            <SegmentGroup.Indicator />
                            <SegmentGroup.Item value="notes" flex="1">
                                <SegmentGroup.ItemText>Notes</SegmentGroup.ItemText>
                                <SegmentGroup.ItemHiddenInput />
                            </SegmentGroup.Item>
                            <SegmentGroup.Item value="tags" flex="1">
                                <SegmentGroup.ItemText>Tags</SegmentGroup.ItemText>
                                <SegmentGroup.ItemHiddenInput />
                            </SegmentGroup.Item>
                        </SegmentGroup.Root>
                    </Box>
                    {leftTab === 'notes' && (<>
                    <HStack px={2} py={1} justify="space-between">
                        <Text fontWeight="bold" fontSize="sm">Notebooks</Text>
                        <IconButton size="xs" variant="ghost" aria-label="Add Notebook"
                            onClick={() => { setDialogType('notebook'); setNewItemName('') }}>
                            <LuPlus />
                        </IconButton>
                    </HStack>
                    <TreeView.Root collection={tree} flex="1" overflowY="auto">
                        <TreeView.Tree>
                            <TreeView.Node
                                indentGuide={<TreeView.BranchIndentGuide />}
                                render={({ node, nodeState }) =>
                                node.value.startsWith('empty-') ? null :
                                (node.value.startsWith('nb-') || node.value.startsWith('ch-')) ? (
                                    <TreeView.BranchControl>
                                        <LuFolder />
                                        {editingNode === node.value ? (
                                            <Input
                                                size="xs"
                                                value={editingName}
                                                autoFocus
                                                onClick={e => e.stopPropagation()}
                                                onChange={e => setEditingName(e.target.value)}
                                                onBlur={() => handleRename(node.value, editingName)}
                                                onKeyDown={e => {
                                                    e.stopPropagation()
                                                    if (e.key === 'Enter') { e.preventDefault(); handleRename(node.value, editingName) }
                                                    if (e.key === 'Escape') { e.preventDefault(); setEditingNode(null) }
                                                }}
                                            />
                                        ) : (
                                            <TreeView.BranchText
                                                onDoubleClick={e => {
                                                    e.stopPropagation()
                                                    setEditingNode(node.value)
                                                    setEditingName(node.label)
                                                }}>
                                                {node.label}
                                            </TreeView.BranchText>
                                        )}
                                        <IconButton size="xs" variant="ghost" ml="auto"
                                            aria-label={`Add ${node.value.startsWith('nb-') ? 'Chapter' : 'Page'}`}
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                setDialogType(node.value.startsWith('nb-') ? 'chapter' : 'page')
                                                setNewItemName('')
                                                setNewItemParentId(parseInt(node.value.split('-')[1]))
                                            }}>
                                            <LuPlus />
                                        </IconButton>
                                        <IconButton size="xs" variant="ghost" colorPalette="red"
                                            aria-label={`Delete ${node.value.startsWith('nb-') ? 'Notebook' : 'Chapter'}`}
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                setConfirmDelete({
                                                    type: node.value.startsWith('nb-') ? 'notebook' : 'chapter',
                                                    id: parseInt(node.value.split('-')[1]),
                                                    label: node.label
                                                })
                                            }}>
                                            <LuTrash2 />
                                        </IconButton>
                                    </TreeView.BranchControl>
                                ) : node.value.startsWith('pg-') ? (
                                    <TreeView.Item
                                        cursor="grab"
                                        opacity={draggedPageId === node.value.split('-')[1] ? 0.4 : 1}
                                        bg={dragOverPageId === node.value.split('-')[1] && draggedPageId !== node.value.split('-')[1] ? 'blue.50' : undefined}
                                        draggable
                                        onDragStart={(e) => {
                                            const pageId = node.value.split('-')[1]
                                            const chapterId = pages.find(p => String(p.id) === pageId)?.chapterId
                                            e.dataTransfer.setData('pageId', pageId)
                                            e.dataTransfer.setData('chapterId', String(chapterId))
                                            e.dataTransfer.effectAllowed = 'move'
                                            setDraggedPageId(pageId)
                                        }}
                                        onDragOver={(e) => {
                                            e.preventDefault()
                                            e.dataTransfer.dropEffect = 'move'
                                            setDragOverPageId(node.value.split('-')[1])
                                        }}
                                        onDragLeave={() => setDragOverPageId(null)}
                                        onDrop={(e) => {
                                            e.preventDefault()
                                            const sourceId = e.dataTransfer.getData('pageId')
                                            const sourceChapterId = e.dataTransfer.getData('chapterId')
                                            const targetId = node.value.split('-')[1]
                                            const targetChapterId = String(pages.find(p => String(p.id) === targetId)?.chapterId)
                                            setDraggedPageId(null)
                                            setDragOverPageId(null)
                                            if (sourceId === targetId || sourceChapterId !== targetChapterId) return
                                            setPages(prev => {
                                                const chId = parseInt(sourceChapterId)
                                                const chapterPages = prev.filter(p => p.chapterId === chId)
                                                const otherPages = prev.filter(p => p.chapterId !== chId)
                                                const fromIdx = chapterPages.findIndex(p => String(p.id) === sourceId)
                                                const toIdx = chapterPages.findIndex(p => String(p.id) === targetId)
                                                const reordered = [...chapterPages]
                                                const [moved] = reordered.splice(fromIdx, 1)
                                                reordered.splice(toIdx, 0, moved)
                                                apiFetch('/notes/reorder_pages', {
                                                    method: 'POST',
                                                    data: { page_ids: reordered.map(p => p.id) }
                                                }).catch(err => console.error('Failed to save page order:', err))
                                                return [...otherPages, ...reordered]
                                            })
                                        }}
                                        onDragEnd={() => { setDraggedPageId(null); setDragOverPageId(null) }}
                                        onClick={() => guardUnsaved(() => setSelectedPage(node.value.split('-')[1]))}>
                                        <LuFile />
                                        {editingNode === node.value ? (
                                            <Input
                                                size="xs"
                                                value={editingName}
                                                autoFocus
                                                onClick={e => e.stopPropagation()}
                                                onChange={e => setEditingName(e.target.value)}
                                                onBlur={() => handleRename(node.value, editingName)}
                                                onKeyDown={e => {
                                                    e.stopPropagation()
                                                    if (e.key === 'Enter') { e.preventDefault(); handleRename(node.value, editingName) }
                                                    if (e.key === 'Escape') { e.preventDefault(); setEditingNode(null) }
                                                }}
                                            />
                                        ) : (
                                            <TreeView.ItemText
                                                onDoubleClick={e => {
                                                    e.stopPropagation()
                                                    setEditingNode(node.value)
                                                    setEditingName(node.label)
                                                }}>
                                                {node.label}
                                            </TreeView.ItemText>
                                        )}
                                        <IconButton size="xs" variant="ghost" colorPalette="red" ml="auto"
                                            aria-label="Delete Page"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                setConfirmDelete({ type: 'page', id: parseInt(node.value.split('-')[1]), label: node.label })
                                            }}>
                                            <LuTrash2 />
                                        </IconButton>
                                    </TreeView.Item>
                                ) : null}
                            />
                        </TreeView.Tree>
                    </TreeView.Root>
                    </>)}
                    {leftTab === 'tags' && (
                        <Box flex="1" overflowY="auto" px={2} py={1}>
                            <HStack mb={2}>
                                <Input
                                    size="xs"
                                    placeholder="New tag..."
                                    value={newTagName}
                                    onChange={e => setNewTagName(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleAddTag()}
                                />
                                <IconButton size="xs" variant="ghost" aria-label="Add Tag" onClick={handleAddTag}>
                                    <LuPlus />
                                </IconButton>
                            </HStack>
                            <VStack alignItems="stretch" gap={1}>
                                {tags.length === 0 ? (
                                    <Text fontSize="xs" color="gray.400" textAlign="center" mt={4}>No tags yet. Add a tag above.</Text>
                                ) : tags.map(tag => (
                                    <Box key={tag.id}>
                                        <HStack
                                            cursor="pointer"
                                            _hover={{ bg: 'gray.50' }}
                                            px={2} py={1} borderRadius="md"
                                            onClick={() => handleExpandTag(tag.id)}
                                        >
                                            <LuTag />
                                            <Text fontSize="sm" flex="1">{tag.name}</Text>
                                            {tagResults[tag.id] && (
                                                <Text fontSize="xs" color="gray.500">{tagResults[tag.id].results.length}p</Text>
                                            )}
                                            <IconButton size="xs" variant="ghost" colorPalette="red"
                                                aria-label="Delete Tag"
                                                onClick={e => { e.stopPropagation(); handleDeleteTag(tag.id) }}>
                                                <LuTrash2 />
                                            </IconButton>
                                        </HStack>
                                        {expandedTagId === tag.id && tagResults[tag.id] && (
                                            <Box pl={6} pb={1}>
                                                {tagResults[tag.id].results.length === 0 ? (
                                                    <Text fontSize="xs" color="gray.400">No occurrences found</Text>
                                                ) : tagResults[tag.id].results.map(r => (
                                                    <HStack key={r.page_id}
                                                        cursor="pointer"
                                                        _hover={{ bg: 'blue.50' }}
                                                        px={2} py={1} borderRadius="sm"
                                                        onClick={() => { guardUnsaved(() => { setSelectedPage(String(r.page_id)); setLeftTab('notes') }) }}>
                                                        <LuFile />
                                                        <VStack gap={0} alignItems="flex-start" flex="1" minW={0}>
                                                            <Text fontSize="xs" fontWeight="medium" overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap">{r.page_name}</Text>
                                                            <Text fontSize="xs" color="gray.400" overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap">{r.notebook_name} › {r.chapter_name}</Text>
                                                        </VStack>
                                                        <Text fontSize="xs" color="blue.500" flexShrink={0}>×{r.count}</Text>
                                                    </HStack>
                                                ))}
                                            </Box>
                                        )}
                                    </Box>
                                ))}
                            </VStack>
                        </Box>
                    )}
                </VStack>

                <RichTextEditor.Root editor={editor} w="80%" h="100%" display="flex" flexDirection="column">
                    <RichTextEditor.Toolbar>
                        <RichTextEditor.ControlGroup inert={!editable} opacity={!editable ? 0.5 : 1}>
                            <Control.Bold />
                            <Control.Italic />
                            <Control.Underline />
                        </RichTextEditor.ControlGroup>
                        <RichTextEditor.ControlGroup>
                            <ModePicker
                                width="120px"
                                currentMode={editable ? "edit" : "view"}
                                onModeChange={handleModeChange}
                            />
                        </RichTextEditor.ControlGroup>
                        <RichTextEditor.ControlGroup>
                            <Button size="sm" variant="ghost" disabled={!selectedPage || !editable} onClick={handleSave}>
                                <LuSave /> Save
                            </Button>
                        </RichTextEditor.ControlGroup>
                    </RichTextEditor.Toolbar>
                    <Box overflowY="auto" flex="1" minH="0" bg="white">
                        <RichTextEditor.Content />
                    </Box>
                </RichTextEditor.Root>
            </HStack>

            <Dialog.Root open={dialogType !== null} onOpenChange={(e) => { if (!e.open) setDialogType(null) }}>
                <Dialog.Backdrop />
                <Dialog.Positioner>
                    <Dialog.Content>
                        <Dialog.Header>
                            <Dialog.Title>{dialogTitle}</Dialog.Title>
                        </Dialog.Header>
                        <Dialog.Body>
                            <Stack gap={3}>
                                <Input
                                    placeholder="Name"
                                    value={newItemName}
                                    onChange={(e) => setNewItemName(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === 'Enter') handleDialogSubmit() }}
                                    autoFocus
                                />
                                {dialogType === 'chapter' && (
                                    <NativeSelect.Root>
                                        <NativeSelect.Field
                                            value={newChapterCategory}
                                            onChange={(e) => setNewChapterCategory(e.target.value)}
                                        >
                                            <option value="character">Character</option>
                                            <option value="session">Session</option>
                                            <option value="place">Place</option>
                                            <option value="other">Other</option>
                                        </NativeSelect.Field>
                                        <NativeSelect.Indicator />
                                    </NativeSelect.Root>
                                )}
                            </Stack>
                        </Dialog.Body>
                        <Dialog.Footer>
                            <Button variant="outline" onClick={() => setDialogType(null)}>Cancel</Button>
                            <Button onClick={handleDialogSubmit} disabled={!newItemName.trim()}>Create</Button>
                        </Dialog.Footer>
                        <Dialog.CloseTrigger />
                    </Dialog.Content>
                </Dialog.Positioner>
            </Dialog.Root>

            <Dialog.Root open={confirmDelete !== null} onOpenChange={(e) => { if (!e.open) setConfirmDelete(null) }}>
                <Dialog.Backdrop />
                <Dialog.Positioner>
                    <Dialog.Content>
                        <Dialog.Header>
                            <Dialog.Title>Delete {confirmDelete?.type}?</Dialog.Title>
                        </Dialog.Header>
                        <Dialog.Body>
                            <Text>
                                Are you sure you want to delete <strong>"{confirmDelete?.label}"</strong>?
                                {confirmDelete?.type === 'notebook' && ' This will also delete all chapters and pages inside it.'}
                                {confirmDelete?.type === 'chapter' && ' This will also delete all pages inside it.'}
                                {' '}This cannot be undone.
                            </Text>
                        </Dialog.Body>
                        <Dialog.Footer>
                            <Button variant="outline" onClick={() => setConfirmDelete(null)}>Cancel</Button>
                            <Button colorPalette="red" onClick={handleConfirmDelete}>Delete</Button>
                        </Dialog.Footer>
                        <Dialog.CloseTrigger />
                    </Dialog.Content>
                </Dialog.Positioner>
            </Dialog.Root>
        </Box>
    )
}

export default NotesDashboard