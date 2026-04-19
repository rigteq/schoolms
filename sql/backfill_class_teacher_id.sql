-- ONE-TIME BACKFILL: sync class_teacher_id from teachers_data.class_ids
-- This fixes classes where a teacher was assigned via the detail page 
-- but class_teacher_id was never set on the classes table.

UPDATE classes c
SET class_teacher_id = td.id
FROM teachers_data td
WHERE 
    c.class_teacher_id IS NULL          -- only update unassigned classes
    AND c.is_deleted = false
    AND td.class_ids @> ARRAY[c.id]::uuid[]  -- teacher has this class in their array
    -- Pick just one teacher per class (the first assigned)
    AND td.id = (
        SELECT id 
        FROM teachers_data 
        WHERE class_ids @> ARRAY[c.id]::uuid[]
        LIMIT 1
    );
