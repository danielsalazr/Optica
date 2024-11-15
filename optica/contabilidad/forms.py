# forms.py
class cedulaForm(forms.ModelForm):

    class Meta:
        widgets = {
            'cedula': forms.IntegerInput(attrs={'size': 3}),
        }