module.exports = {
    up: async (query, DataTypes) => {
        await query.changeColumn('assignments', 'title', {type: DataTypes.TEXT});  
        await query.changeColumn('assignments', 'notes', {type: DataTypes.TEXT});
    }
};