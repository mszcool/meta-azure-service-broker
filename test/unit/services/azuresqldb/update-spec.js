var deepExtend = require('deep-extend');
var HttpStatus = require('http-status-codes');
var sinon = require('sinon');
var CmdUpdate = require('../../../../lib/services/azuresqldb/cmd-update');
var azuresqldb = require('../../../../lib/services/azuresqldb');
var SqldbOperations = require('../../../../lib/services/azuresqldb/client');
var msRestRequest = require('../../../../lib/common/msRestRequest');
var azure = require('../helpers').azure;
var EventEmitter = require('events');
var mockingHelper = require('../mockingHelper');
require('should');

var sqldbOps = new SqldbOperations(azure);

var Handlers, Common;

mockingHelper.backup();

describe('SqlDb - Update', function () {
    
    var config = {
        azure: azure,
        'serviceBroker': {
            'credentials': {
                'authUser': 'SECURITY_USER_NAME',
                'authPassword': 'SECURITY_USER_PASSWORD'
            }
        },
        'database': {
            'provider': 'AZURE_BROKER_DATABASE_PROVIDER',
            'server': 'AZURE_BROKER_DATABASE_SERVER',
            'user': 'AZURE_BROKER_DATABASE_USER',
            'password': 'AZURE_BROKER_DATABASE_PASSWORD',
            'database': 'AZURE_BROKER_DATABASE_NAME',
            'encryptionKey': 'AZURE_BROKER_DATABASE_ENCRYPTION_KEY'
        },
        'privilege': {
            'sqldb': {
                'allowToCreateSqlServer': 'true'
            }
        },
        'accountPool': {
            'sqldb': {
            }
        },
        'defaultSettings': {
            'sqldb': {
                'transparentDataEncryption': 'true'
            }
        }
    };
    
    var getConfigStub;
    
    beforeEach(function () {
        // Need to mock common.getConfigurations before requiring api-handlers or else it throws at require time
        Common = require('../../../../lib/common');
        getConfigStub = sinon.stub(Common, 'getConfigurations').returns(config);
        Handlers = require('../../../../lib/broker/v2/api-handlers');
    });
    
    afterEach(function () {
        getConfigStub.restore();
    });
    
    var validParams = {
        'azure': azure,
        'instance': {
            'azureInstanceId': 'azure-sqldb-user-mysqlsvr-mydb',
            'status': 'success',
            'timestamp': '2017-03-24T04:51:49.466Z',
            'instance_id': 'aa4d7eff-70af-4637-bf5e-398ebaf1ac2c',
            'service_id': 'fb9bc99e-0aa9-11e6-8a8a-000d3a002ed5',
            'plan_id': '3819fdfa-0aaa-11e6-86f4-000d3a002ed5', // Basic plan
            'organization_guid': 'b499ecff-378e-4e48-ae13-6e027ac9edf4',
            'space_guid': 'fba5706c-74c2-448d-9fc7-ce3f0500557e',
            'parameters': {
                'location': 'westus',
                'resourceGroup': 'user-rg1',
                'sqlServerName': 'user-mysqlsvr',
                'sqlServerParameters': {
                    'allowSqlServerFirewallRules': [
                        {
                            'endIpAddress': '167.220.1.0',
                            'ruleName': 'MS',
                            'startIpAddress': '167.220.0.0'
                        }
                    ],
                    'properties': {
                        'administratorLogin': 'user',
                        'administratorLoginPassword': 'currentPassword425'
                    }
                },
                'sqldbName': 'mydb',
                'sqldbParameters': {
                    'properties': {
                        'collation': 'SQL_Latin1_General_CP1_CI_AS'
                    }
                },
                'transparentDataEncryption': true
            },
            'last_operation': 'provision',
            'provisioning_result': {
                'tags': {
                    'user-agent': 'meta-azure-service-broker'
                },
                'id': '/subscriptions/e5839dfd-61f0-4b2f-b06f-de7fc47b5998/resourceGroups/user-rg1/providers/Microsoft.Sql/servers/user-mysqlsvr/databases/mydb',
                'name': 'mydb',
                'type': 'Microsoft.Sql/servers/databases',
                'location': 'West US',
                'kind': 'v12.0,user',
                'properties': {
                    'databaseId': '7ee66e8f-32bd-46d9-8a6a-a67ef166080b',
                    'edition': 'Basic',
                    'status': 'Online',
                    'serviceLevelObjective': 'Basic',
                    'collation': 'SQL_Latin1_General_CP1_CI_AS',
                    'maxSizeBytes': '2147483648',
                    'creationDate': '2017-03-24T04:50:43.32Z',
                    'currentServiceObjectiveId': 'dd6d99bb-f193-4ec1-86f2-43d3bccbc49c',
                    'requestedServiceObjectiveId': 'dd6d99bb-f193-4ec1-86f2-43d3bccbc49c',
                    'requestedServiceObjectiveName': 'Basic',
                    'sampleName': null,
                    'defaultSecondaryLocation': 'East US',
                    'earliestRestoreDate': '2017-03-24T05:01:15.533Z',
                    'elasticPoolName': null,
                    'containmentState': 2,
                    'readScale': 'Disabled',
                    'failoverGroupId': null
                },
                'operation': 'CreateLogicalDatabase',
                'startTime': '/Date(1490331043055+0000)/',
                'resourceGroup': 'user-rg1',
                'sqlServerName': 'user-mysqlsvr',
                'fullyQualifiedDomainName': 'user-mysqlsvr.database.windows.net',
                'administratorLogin': 'user',
                'administratorLoginPassword': 'currentPassword425'
            },
            'state':{},
        },
        'requested': {
            'parameters': {
                'sqlServerParameters': {
                    'properties': {
                        'administratorLoginPassword': 'newPassword425'
                    }
                }
            },
            'accepts_incomplete': 'true',
        },
        'service_id': 'fb9bc99e-0aa9-11e6-8a8a-000d3a002ed5'
    };
    

    var validParamsUpdatePlan = deepExtend({}, validParams);
    validParamsUpdatePlan.requested = {
        'instance_id': 'b93fb802-8342-40b0-ac25-3217c420ee9a',
        'service_id': 'fb9bc99e-0aa9-11e6-8a8a-000d3a002ed5',
        'plan_id': '2497b7f3-341b-4ac6-82fb-d4a48c005e19'
    };

    var newPassword = validParams.requested.parameters.sqlServerParameters.properties.administratorLoginPassword;
    
    var updateDiff = {
        'parameters': {
            'sqlServerParameters': {
                'properties': {
                    'administratorLoginPassword': newPassword
                }
            }
        },
        'provisioning_result': {
            'administratorLoginPassword': newPassword
        },
        'last_operation': 'update'
    };
    
    
    var expectedUpdatedInstance = deepExtend(deepExtend({}, validParams.instance), updateDiff);
    var sqldbUpdate;
    
    describe('Configuration', function(){
        it('Should request a different password than the current one', function () {
            newPassword.should.not.equal(validParams.instance['provisioning_result'].administratorLoginPassword);
        });
        
        it('Should have the same password in request params and provisionning result', function () {
            var pass1 = validParams.instance['provisioning_result'].administratorLoginPassword;
            var pass2 = validParams.instance.parameters.sqlServerParameters.properties.administratorLoginPassword;
            pass1.should.equal(pass2);
        });
    });
    
    describe('cmd-update', function(){

        describe('sqlserver password update', function(){
            before(function () {
                sqldbUpdate = new CmdUpdate(validParams);
            });
            
            it('should not exist error', function (done) {
                sqldbUpdate.update(sqldbOps, function updateCallback(err, result, updatedInstance) {
                    done(err);
                });
            });
            
            it('should return success', function (done) {
                sqldbUpdate.update(sqldbOps, function updateCallback(err, result, updatedInstance) {
                    result.should.deepEqual({ statusCode: HttpStatus.OK, code: HttpStatus.getStatusText(HttpStatus.OK), value:{
                        'description': 'Updated sqlserver password in broker database',
                        'state': 'succeeded'
                    } });
                    done(err);
                });
            });
            
            it('should only update instance password', function(done) {
                sqldbUpdate.update(sqldbOps, function updateCallback(err, reply, updatedInstance) {
                    updatedInstance.should.deepEqual(expectedUpdatedInstance);
                    done(err);
                });
            });
        });

        describe('plan update', function(){

            var createDatabaseStub;
            var asyncURL = 'https://management.azure.com/subscriptions/<uuid>/resourceGroups/niroy-rg1/providers/Microsoft.Sql/servers/niroy-sqlsvr/databases/test-db/azureAsyncOperation/<uuid>?api-version=2014-04-01-Preview"';

            afterEach(function(){
                createDatabaseStub.restore();
            });

            it('should save the azure-asyncoperation header for future polling requests', function(done){
                sqldbUpdate = new CmdUpdate(validParamsUpdatePlan);
                createDatabaseStub = sinon.stub(SqldbOperations.prototype, 'createDatabase').yields(null, { statusCode: 202, res: { headers: { 'azure-asyncoperation': asyncURL } } });

                sqldbUpdate.update(sqldbOps, function updateCallback(err, result, updatedInstance) {
                    result.should.deepEqual({
                        statusCode: HttpStatus.ACCEPTED, code: HttpStatus.getStatusText(HttpStatus.ACCEPTED), value: {
                            'state': 'in progress',
                            'description': 'Azure accepted sql database update request for mydb'
                        }
                    });

                    updatedInstance.state.asyncOperation.should.equal(asyncURL);
                    done(err);
                });
            });

            it('Should fail on empty requested params', function(done) {
                var emptyUpdateParams = deepExtend({}, validParams);
                emptyUpdateParams.requested = {};
                sqldbUpdate = new CmdUpdate(emptyUpdateParams);
                createDatabaseStub = sinon.stub(SqldbOperations.prototype, 'createDatabase').yields(new Error('Azure Error'), { statusCode: 400 });

                sqldbUpdate.update(sqldbOps, function updateCallback(err, result, updatedInstance) {
                    err.should.not.be.null();
                    done();
                });
            });
        });
    });
    
    describe('index.update', function(){
        
        var msRestRequeststub;
        
        beforeEach(function () {
            msRestRequeststub = sinon.stub(msRestRequest, 'PUT').yields(null, { statusCode: HttpStatus.ACCEPTED }, { body: 'This is my body' });
        });
        
        afterEach(function (){
            msRestRequeststub.restore();
        });
        
        it('should not exist error', function(done){
            azuresqldb.update(validParams, function(err, reply, newInstance){
                reply.should.deepEqual({
                    'code': HttpStatus.getStatusText(HttpStatus.OK),
                    'statusCode': HttpStatus.OK,
                    'value': {
                        'description': 'Updated sqlserver password in broker database',
                        'state': 'succeeded'
                    }});
                    newInstance.should.deepEqual(expectedUpdatedInstance);
                    done(err);
                });
            });
        });

        describe('Broker.HandleUpdateRequest', function(){
            
            var broker;
            var res;
            var req = {
                params: {
                    'instance_id': 'aa4d7eff-70af-4637-bf5e-398ebaf1ac2c',
                    'parameters': {
                        'sqlServerParameters': {
                            'properties': {
                                'administratorLoginPassword': newPassword
                            }
                        }
                    }
                },
                connection:{
                    remoteAddress: 'REMOTE_ADDRESS',
                    remotePort:1234
                }
            };
            
            var getServiceInstanceStub, setServiceInstanceStub;

            beforeEach(function() {
                getServiceInstanceStub = sinon.stub().yields(null, validParams.instance);
                setServiceInstanceStub = sinon.stub().yields(null);
                
                
                broker = new EventEmitter();
                broker.db = {
                    getServiceInstance: getServiceInstanceStub,
                    setServiceInstance: setServiceInstanceStub,
                };
                
                var serviceID = validParams.instance['service_id'];
                broker.on('update-' + serviceID, azuresqldb.update);
                res = {
                    send:sinon.spy()
                };
            });
            
            afterEach(function() {
            });
            
            it('should not exist error', function(done){
                Handlers.handleUpdateRequest(broker, req, res, done);
            });
            
            it('should call methods in order', function (done) {
                Handlers.handleUpdateRequest(broker, req, res, function() {
                    getServiceInstanceStub.calledOnce.should.be.true();
                    setServiceInstanceStub.calledOnce.should.be.true();
                    res.send.calledOnce.should.be.true();
                    getServiceInstanceStub.calledBefore(setServiceInstanceStub).should.be.true();
                    setServiceInstanceStub.calledBefore(res.send).should.be.true();
                    done();
                });
            });
            
            it('should return 202 code on success', function (done) {
                Handlers.handleUpdateRequest(broker, req, res, function(){
                    res.send.calledOnce.should.be.true();
                    res.send.args.should.deepEqual([[200, {'description': 'Updated sqlserver password in broker database', 'state': 'succeeded'}]]);
                    done();
                });
            });
            
            describe('should fail', function(){
                var err;
                beforeEach(function () {
                    err = { statusCode: 404, message: 'Instance not found' };
                    getServiceInstanceStub = sinon.stub().yields(err, {});
                    
                    broker.db = {
                        getServiceInstance: getServiceInstanceStub,
                        setServiceInstance: setServiceInstanceStub
                    };
                });
                
                it('if can\'t get instance', function (done) {
                    Handlers.handleUpdateRequest(broker, req, res, function () {
                        res.send.args.should.deepEqual([[404, err]]);
                        done();
                    });
                });
            });
            
            describe('Update service plan', function(done){
                
                var req = {
                    params: {
                        // 'azure' : azure,
                        'instance_id': 'aa4d7eff-70af-4637-bf5e-398ebaf1ac2c',
                        'service_id' : 'fb9bc99e-0aa9-11e6-8a8a-000d3a002ed5',
                        'plan_id' :'2497b7f3-341b-4ac6-82fb-d4a48c005e19',
                        'accepts_incomplete': 'true'
                    },
                    connection: {
                        remoteAddress: 'REMOTE_ADDRESS',
                        remotePort: 1234
                    }
                };
                
                var createDatabaseStub;
                
                beforeEach(function () {
                    createDatabaseStub = sinon.stub(SqldbOperations.prototype, 'createDatabase').yields(null, {statusCode:202, res:{headers:{'x-ms-request-id':'a-uuid-for-the-create-request-operation-status'}}});
                });
                
                afterEach(function (){
                    createDatabaseStub.restore();
                });
                
                it('should return 202 code on success', function (done) {
                    Handlers.handleUpdateRequest(broker, req, res, function () {
                        res.send.calledOnce.should.be.true();
                        res.send.args.should.deepEqual([[202, { 'description': 'Azure accepted sql database update request for mydb', 'state': 'in progress' }]]);
                        done();
                    });
                });
            });
        });
    });
    