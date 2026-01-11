# Teacher Lessons Page - Implementation Guide

## Overview
The Teacher Lessons page allows teachers to:
1. View their lessons for a selected day (Mon-Fri)
2. Switch between weekdays with automatic lesson fetching
3. Click a lesson to view and manage students in that group
4. Add performance and homework points for students
5. Submit points to the backend API

## Features Implemented

### ✅ Day Selector
- **File**: `src/Pages/teacher/Lessons/DaySelector.jsx`
- Shows Monday-Friday buttons for the current week
- Displays the date number for each day
- Previous/Next week navigation
- Highlights the currently selected day in blue
- Disables weekends (Saturday/Sunday)

### ✅ Lessons List
- **File**: `src/Pages/teacher/Lessons/LessonsList.jsx`
- Displays all lessons for the selected day in a card grid
- Shows:
  - Subject name
  - Class pair (Grade-Class)
  - Time slot (start_time - end_time)
  - Room number
- Click a lesson to open the student points modal
- Empty state when no lessons are scheduled

### ✅ Student Points Modal
- **File**: `src/Pages/teacher/Lessons/StudentPointsModal.jsx`
- Opens when a lesson is clicked
- Fetches students for the lesson's group
- Displays a table with:
  - Student name
  - Performance points input (0-100)
  - Homework points input (0-100)
- Submit button sends all points to `/points` endpoint
- Shows loading, error, and success states
- Prevents duplicate submissions with disabled state

### ✅ Main Lesson Page
- **File**: `src/Pages/teacher/Lessons/TeacherLessonsPage.jsx`
- Default date: Today
- Fetches lessons from `/timetable/my-lessons?date=YYYY-MM-DD`
- Manages selected lesson state
- Handles day changes and refreshes lessons
- Error handling and loading states

## API Endpoints Used

### GET /timetable/my-lessons
```
Query: { date: "YYYY-MM-DD" }
Response: { lessons: [ { id, day, room, grade, class, class_pair, subject, time_slot, start_time, end_time } ] }
```

### GET /students
```
Query: { group_id, academic_year_id: 1, include_group: 1 }
Response: { students: [ { id, full_name, ... } ] }
```

### POST /points
```
Body: {
  student_id: number,
  lesson_id: number,
  group_id: string|number,
  subject_id: number,
  type: "performance" | "homework",
  value: number,
  date: "YYYY-MM-DD"
}
Response: { success: true }
```

## File Structure
```
src/Pages/teacher/Lessons/
├── TeacherLessonsPage.jsx      # Main page component
├── DaySelector.jsx              # Day/week selector component
├── LessonsList.jsx              # Lessons display component
└── StudentPointsModal.jsx       # Points input modal
```

## Routing
Added to `src/App.jsx`:
```
Route path="/teacher/lessons" → TeacherLessonsPage
```

## UI Components Used
- **lucide-react icons**: Calendar, Clock, MapPin, Users, AlertCircle, CheckCircle, Loader, ChevronLeft, ChevronRight, BookOpen, X
- **Tailwind CSS**: All styling and responsive design
- **react-hot-toast**: Success and error notifications

## State Management
- Selected date state in TeacherLessonsPage
- Lessons fetched from API
- Selected lesson state
- Points form state in StudentPointsModal
- Loading and error states throughout

## Key Features

### Automatic Lessons Refresh
When the user changes the day, the page automatically:
1. Fetches lessons for the new date
2. Clears the previously selected lesson
3. Shows loading state during fetch

### Points Submission
The modal:
1. Collects all filled point values (both performance and homework)
2. Validates that at least one value is entered
3. Sends POST requests for each point
4. Shows success/error feedback
5. Prevents duplicate submissions during loading
6. Clears the form after successful submission

### Error Handling
- Network errors are caught and displayed to the user
- Invalid or missing data shows appropriate error messages
- Users can retry failed operations
- Toast notifications for quick feedback

### Responsive Design
- Mobile-first approach
- Grid layout adapts to screen size
- Modal works on all screen sizes
- Input fields are appropriately sized

## Acceptance Criteria Met

✅ Today's lessons load by default
✅ Switching to any weekday updates the list
✅ Lesson click loads students for that group
✅ Points for performance and homework are created via POST /points
✅ Success is visible to the teacher via toast notifications
✅ Day selector shows Mon-Fri only
✅ Disabled submit while pending
✅ Loading and error states for lessons and students
✅ Prevent duplicate submissions (disable button during submit)
✅ Preserve selected day in state
✅ Currently open lesson state is maintained

## Testing the Implementation

1. **Navigate to the page**:
   - Go to `/teacher/lessons`

2. **Day Selection**:
   - Verify today is selected by default
   - Click different days to see lessons update
   - Try week navigation buttons

3. **Lesson Interaction**:
   - Click a lesson card to open the modal
   - Verify student list loads
   - Enter points for one or more students

4. **Point Submission**:
   - Enter performance and/or homework points
   - Click "Submit Points"
   - Watch for success toast notification
   - Verify data is sent to backend

5. **Error Cases**:
   - Try submitting without entering any points (should show error)
   - Network error testing can be done via browser DevTools

## Future Enhancements

- Batch API requests for multiple students
- Export points to CSV
- Undo functionality
- Point history view
- Student filtering/search
- Points validation (min/max values)
- Dark mode support
