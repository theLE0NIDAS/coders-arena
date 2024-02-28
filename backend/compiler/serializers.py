from rest_framework import serializers
from .models import User, Problem, Submission


class UserSerializer(serializers.Serializer):
    email = serializers.CharField(max_length=100)
    password = serializers.CharField(max_length=100)
    registeredOn = serializers.DateTimeField()

    def create(self, validated_data):
        return User.objects.create(validated_data)

    def update(self, instance, validated_data):
        instance.email = validated_data.get('email', instance.email)
        instance.password = validated_data.get('password', instance.password)
        instance.registeredOn = validated_data.get(
            'registeredOn', instance.registeredOn)
        instance.save()
        return instance


class ProblemsSerializer(serializers.ModelSerializer):
    class Meta:
        model = Problem
        fields = ['id', 'title', 'level']


class ProblemSerializer(serializers.ModelSerializer):
    class Meta:
        model = Problem
        fields = ['id', 'title', 'level', 'description',
                  'createdOn', 'timeout', 'input1', 'output1', 'input2', 'output2', 'constraint']


class SubmissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Submission
        fields = ['id', 'verdict', 'verdictCode', 'submittedOn', 'language']
