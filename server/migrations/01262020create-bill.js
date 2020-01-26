module.exports = {
  up: (queryInterface, Sequelize) =>
    queryInterface.createTable('Bills', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID
      },
      owner_id: {
        allowNull: false,
        type: Sequelize.UUID,
        noUpdate: true
      },
      vendor: {
        type: Sequelize.STRING
      },
      bill_date: {
        type: Sequelize.DATE
      },
      due_date: {
        type: Sequelize.DATE
      },
      amount_due: {
        type: Sequelize.DOUBLE,
        allowNull: false,
        validate: {
          min: 0.01
        }
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    }),
  down: (queryInterface /* , Sequelize */) => queryInterface.dropTable('Bills'),
};
