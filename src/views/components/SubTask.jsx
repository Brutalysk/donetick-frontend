import { DndContext, closestCenter } from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  ChevronRight,
  Delete,
  DragIndicator,
  Edit,
  ExpandMore,
  KeyboardReturn,
  PlaylistAdd,
} from '@mui/icons-material'
import {
  Box,
  Checkbox,
  IconButton,
  Input,
  List,
  ListItem,
  Typography,
} from '@mui/joy'
import React, { useState } from 'react'
import { CompleteSubTask } from '../../utils/Fetcher'

function SortableItem({
  task,
  index,
  handleToggle,
  handleDelete,
  handleAddSubtask,
  allTasks,
  setTasks,
  level = 0,
  editMode,
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: task.id })

  const [isEditing, setIsEditing] = useState(false)
  const [editedText, setEditedText] = useState(task.name)
  const [expanded, setExpanded] = useState(false)
  const [showAddSubtask, setShowAddSubtask] = useState(false)
  const [newSubtask, setNewSubtask] = useState('')

  // Find child tasks
  const childTasks = allTasks.filter(t => t.parentId === task.id)
  const hasChildren = childTasks.length > 0

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    flexDirection: { xs: 'column', sm: 'row' },
    touchAction: 'none',
    paddingLeft: `${level * 24}px`,
  }

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleSave = () => {
    setIsEditing(false)
    task.name = editedText
    // Update the task in the parent component
    setTasks(prevTasks =>
      prevTasks.map(t => (t.id === task.id ? { ...t, name: editedText } : t)),
    )
  }

  const handleExpandClick = () => {
    setExpanded(!expanded)
  }

  const handleAddSubtaskClick = () => {
    setShowAddSubtask(!showAddSubtask)
  }

  const submitNewSubtask = () => {
    if (!newSubtask.trim()) return

    handleAddSubtask(task.id, newSubtask)
    setNewSubtask('')
    setShowAddSubtask(false)
    setExpanded(true) // Auto-expand to show the new subtask
  }

  const handleKeyPress = event => {
    if (event.key === 'Enter') {
      submitNewSubtask()
    }
  }

  return (
    <>
      <ListItem ref={setNodeRef} style={style} {...attributes}>
        {editMode && (
          <IconButton {...listeners} {...attributes} size='sm'>
            <DragIndicator />
          </IconButton>
        )}

        {hasChildren && (
          <IconButton
            size='sm'
            variant='plain'
            color='neutral'
            onClick={handleExpandClick}
          >
            {expanded ? <ExpandMore /> : <ChevronRight />}
          </IconButton>
        )}

        {!hasChildren && level > 0 && (
          <Box sx={{ width: 28 }} /> // Spacer for alignment not sure of better way for now it's good
        )}

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            flex: 1,
          }}
        >
          {!editMode && (
            <Checkbox
              checked={!!task.completedAt}
              onChange={() => handleToggle(task.id)}
            />
          )}
          <Box
            sx={{
              flex: 1,
              minHeight: 50,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
            }}
            onClick={() => {
              if (!editMode) {
                handleToggle(task.id)
              }
            }}
          >
            {isEditing ? (
              <Input
                value={editedText}
                onChange={e => setEditedText(e.target.value)}
                onBlur={handleSave}
                onKeyPress={e => {
                  if (e.key === 'Enter') {
                    handleSave()
                  }
                }}
                autoFocus
              />
            ) : (
              <Typography
                sx={{
                  textDecoration: task.completedAt ? 'line-through' : 'none',
                }}
                onDoubleClick={handleEdit}
              >
                {task.name}
              </Typography>
            )}
            {task.completedAt && (
              <Typography
                sx={{
                  display: { xs: 'block', sm: 'inline' },
                  color: 'text.secondary',
                  fontSize: 'sm',
                }}
              >
                {new Date(task.completedAt).toLocaleString()}
              </Typography>
            )}
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 1 }}>
          {editMode && (
            <>
              <IconButton
                variant='soft'
                color='primary'
                size='sm'
                onClick={handleAddSubtaskClick}
                title='Add subtask'
              >
                <PlaylistAdd />
              </IconButton>
              <IconButton variant='soft' size='sm' onClick={handleEdit}>
                <Edit />
              </IconButton>
              <IconButton
                variant='soft'
                color='danger'
                size='sm'
                onClick={() => handleDelete(task.id)}
              >
                <Delete />
              </IconButton>
            </>
          )}
        </Box>
      </ListItem>

      {/* Add subtask input field */}
      {showAddSubtask && (
        <ListItem
          sx={{
            paddingLeft: `${(level + 1) * 24}px`,
            paddingTop: 0,
            paddingBottom: 1,
          }}
        >
          <Box sx={{ display: 'flex', width: '100%', gap: 1 }}>
            <Input
              placeholder='Add new subtask...'
              value={newSubtask}
              onChange={e => setNewSubtask(e.target.value)}
              onKeyPress={handleKeyPress}
              sx={{ flex: 1 }}
              autoFocus
            />
            <IconButton onClick={submitNewSubtask} size='sm'>
              <KeyboardReturn />
            </IconButton>
          </Box>
        </ListItem>
      )}

      {/* Child tasks */}
      {hasChildren && expanded && (
        <Box sx={{ paddingLeft: `${level * 24}px` }}>
          {childTasks
            .sort((a, b) => a.orderId - b.orderId)
            .map((childTask, childIndex) => (
              <SortableItem
                key={childTask.id}
                task={childTask}
                index={childIndex}
                handleToggle={handleToggle}
                handleDelete={handleDelete}
                handleAddSubtask={handleAddSubtask}
                allTasks={allTasks}
                setTasks={setTasks}
                level={level + 1}
                editMode={editMode}
              />
            ))}
        </Box>
      )}
    </>
  )
}

const SubTasks = ({ editMode = true, choreId = 0, tasks = [], setTasks }) => {
  const [newTask, setNewTask] = useState('')

  const topLevelTasks = tasks.filter(task => task.parentId === null)

  const handleToggle = taskId => {
    const updatedTask = tasks.find(task => task.id === taskId)
    const newCompletedAt = updatedTask.completedAt
      ? null
      : new Date().toISOString()

    // Update the task
    const updatedTasks = tasks.map(task =>
      task.id === taskId ? { ...task, completedAt: newCompletedAt } : task,
    )

    // If completing a task, also complete all child tasks
    if (newCompletedAt) {
      const completeChildren = parentId => {
        const children = updatedTasks.filter(t => t.parentId === parentId)
        children.forEach(child => {
          const index = updatedTasks.findIndex(t => t.id === child.id)
          if (index !== -1) {
            updatedTasks[index] = {
              ...updatedTasks[index],
              completedAt: newCompletedAt,
            }
            completeChildren(child.id) // Recursively complete grandchildren
          }
        })
      }
      completeChildren(taskId)
    }

    CompleteSubTask(taskId, Number(choreId), newCompletedAt).then(res => {
      if (res.status !== 200) {
        console.log('Error updating task')
        return
      }
    })

    setTasks(updatedTasks)
  }

  const handleDelete = taskId => {
    // Find all descendant tasks to delete
    const findDescendants = id => {
      const descendants = []
      const children = tasks.filter(t => t.parentId === id)

      children.forEach(child => {
        descendants.push(child.id)
        descendants.push(...findDescendants(child.id))
      })

      return descendants
    }

    const descendantIds = findDescendants(taskId)
    const idsToDelete = [taskId, ...descendantIds]

    // Filter out the task and all its descendants
    const updatedTasks = tasks
      .filter(task => !idsToDelete.includes(task.id))
      .map((task, index) => ({
        ...task,
        orderId: task.parentId === null ? index : task.orderId,
      }))

    setTasks(updatedTasks)
  }

  const handleAdd = () => {
    if (!newTask.trim()) return

    const newTaskObj = {
      name: newTask,
      completedAt: null,
      orderId: topLevelTasks.length,
      parentId: null,
      id: (tasks.length + 1) * -1, // Temporary negative ID
    }

    setTasks([...tasks, newTaskObj])
    setNewTask('')
  }

  const handleAddSubtask = (parentId, name) => {
    if (!name.trim()) return

    // Find siblings to determine orderId
    const siblings = tasks.filter(t => t.parentId === parentId)

    const newSubtask = {
      name,
      completedAt: null,
      orderId: siblings.length,
      parentId,
      id: (tasks.length + 1) * -1, // Temporary negative ID
    }

    setTasks([...tasks, newSubtask])
  }

  const onDragEnd = event => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    setTasks(items => {
      const oldIndex = items.findIndex(item => item.id === active.id)
      const newIndex = items.findIndex(item => item.id === over.id)

      if (oldIndex === -1 || newIndex === -1) return items

      const activeItem = items[oldIndex]
      const overItem = items[newIndex]

      const reorderedItems = arrayMove(items, oldIndex, newIndex)

      const parentId = overItem.parentId
      const siblings = reorderedItems.filter(item => item.parentId === parentId)

      return reorderedItems.map(item => {
        if (item.id === activeItem.id) {
          return { ...item, parentId, orderId: siblings.indexOf(item) }
        }
        return item.parentId === parentId
          ? { ...item, orderId: siblings.indexOf(item) }
          : item
      })
    })
  }

  const handleKeyPress = event => {
    if (event.key === 'Enter') {
      handleAdd()
    }
  }

  return (
    <>
      <DndContext collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={tasks} strategy={verticalListSortingStrategy}>
          <List sx={{ padding: 0 }}>
            {topLevelTasks
              .sort((a, b) => a.orderId - b.orderId)
              .map((task, index) => (
                <SortableItem
                  key={task.id}
                  task={task}
                  index={index}
                  handleToggle={handleToggle}
                  handleDelete={handleDelete}
                  handleAddSubtask={handleAddSubtask}
                  allTasks={tasks}
                  setTasks={setTasks}
                  editMode={editMode}
                />
              ))}
            {editMode && (
              <ListItem sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Input
                  placeholder='Add new task...'
                  value={newTask}
                  onChange={e => setNewTask(e.target.value)}
                  onKeyPress={handleKeyPress}
                  sx={{ flex: 1 }}
                />
                <IconButton onClick={handleAdd}>
                  <KeyboardReturn />
                </IconButton>
              </ListItem>
            )}
          </List>
        </SortableContext>
      </DndContext>
    </>
  )
}

export default SubTasks
