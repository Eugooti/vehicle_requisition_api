const roles = {
    admin:['all'],
    manager:['apply','approve'],
    hrm:['create-user','apply','approve','dpt_report','create-vehicle','read-users','assign-roles','remove-role','add-Vehicle','read-vehicles','update-vehicle','assign'],
    driver:['start','end'],
    applicant:['apply']
}



module.exports = {roles}