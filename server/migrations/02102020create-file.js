module.exports = {
    up: (queryInterface, Sequelize) =>
      queryInterface.createTable('Files', {
        id: {
          allowNull: false,
          primaryKey: true,
          type: Sequelize.UUID
        },
        file_name: {
          type: Sequelize.STRING
        },
        url: {
          type: Sequelize.STRING
        },
        upload_date:{
          type: Sequelize.DATEONLY
        },
        createdAt: {
          type: Sequelize.DATE,
          allowNull: false
        },
        updatedAt: {
          allowNull: false,
          type: Sequelize.DATE,
        },
        size: {
          type: Sequelize.DOUBLE
        },
        fileOwner:{
          type: Sequelize.STRING
        },
        bill:{
          type: Sequelize.UUID
        }
      }),
    down: (queryInterface /* , Sequelize */) => queryInterface.dropTable('Files'),
  };
  