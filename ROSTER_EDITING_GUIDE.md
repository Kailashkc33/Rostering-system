# GrillTalk Roster Management - Admin Guide

## 🎯 Overview
The roster management system allows administrators to create, edit, and manage staff schedules with full support for editing published rosters.

## 🔧 Features Implemented

### ✅ Roster Status Management
- **DRAFT**: Rosters that are still being worked on
- **PUBLISHED**: Live rosters that staff can see and clock into
- **ARCHIVED**: Past rosters for record keeping

### ✅ Shift Editing for Published Rosters
Admins can now **edit shifts even after a roster is published**, with the following safeguards:

1. **Confirmation Prompt**: When editing published rosters, a warning appears asking for confirmation
2. **Visual Indicators**: Published rosters show a warning message that changes affect live schedules
3. **Success Messages**: Different messages for draft vs published roster edits

### ✅ Enhanced Validation
- **Required Fields**: Staff, date, start time, and end time are all required
- **Time Logic**: End time must be after start time
- **Break Calculation**: Automatic break time calculation (30 min for shifts > 6 hours)

### ✅ Roster Management Features
- **View All Rosters**: List view with status, shift count, and actions
- **Edit Roster Details**: Change status, week start date
- **Add New Shifts**: Add shifts to existing rosters
- **Delete Shifts**: Remove shifts with confirmation
- **Copy Rosters**: Copy a roster to the next week automatically

## 🚀 How to Use

### Accessing Roster Management
1. Log in as an **ADMIN** user
2. Navigate to **Dashboard → Admin → Roster**

### Editing Published Rosters
1. Find the published roster in the list
2. Click **"View/Edit"**
3. Click **"Edit"** on any shift you want to modify
4. **Confirm** when prompted about affecting live schedules
5. Make your changes and click **"Save"**

### Managing Roster Status
- **DRAFT → PUBLISHED**: Makes the roster visible to staff
- **PUBLISHED → ARCHIVED**: Moves completed rosters to archive
- Status can be changed directly from the roster list

### Adding New Shifts
1. In the roster detail view, click **"Add Shift"**
2. Fill in all required fields:
   - Staff member
   - Date
   - Start time
   - End time
   - Role (optional)
3. Click **"Add"**

### Copying Rosters
1. From the roster list, click **"Copy"** on any roster
2. Confirm to copy to the next week
3. A new DRAFT roster will be created with all shifts moved forward 7 days

## ⚠️ Important Notes

### Published Roster Editing
- **Staff Impact**: Changes to published rosters immediately affect what staff see
- **Clock-in Impact**: If shifts are deleted or times changed, active clock-ins may be affected
- **Notification**: Consider notifying staff of schedule changes outside the system

### Time Handling
- All times are stored in UTC and displayed in local time
- Date/time combinations are properly validated
- Break times are automatically calculated

### Data Validation
- Start time must be before end time
- All required fields must be filled
- Staff must exist in the system
- Duplicate validation prevents conflicting schedules

## 🐛 Troubleshooting

### Common Issues
1. **"Staff not found"**: Ensure the staff member exists and isn't deleted
2. **"Invalid time"**: Check that end time is after start time
3. **"Cannot publish roster with no shifts"**: Add at least one shift before publishing
4. **"Roster for this week exists"**: When copying, ensure the target week doesn't already have a roster

### Status Issues Fixed
- ✅ Fixed APPROVED vs PUBLISHED status inconsistency
- ✅ Backend now validates correct status values
- ✅ Frontend shows proper status options

## 🔧 Technical Implementation

### Backend Changes
- Fixed status validation in `roster.controller.ts`
- Enhanced shift update API with better error handling
- Improved time parsing and validation

### Frontend Enhancements
- Added confirmation dialogs for published roster edits
- Improved time input handling
- Better error messages and validation
- Visual indicators for published rosters
- Working copy functionality

## 📱 User Experience
- **Clear feedback**: Success/error messages for all actions
- **Safety prompts**: Confirmations for destructive or impactful actions
- **Visual clarity**: Status indicators and warnings
- **Responsive design**: Works on desktop and mobile devices

---

✨ **The roster editing functionality is now fully operational and ready for production use!**